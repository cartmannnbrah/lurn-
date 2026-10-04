import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";
import { Type } from "typebox";

const OTHER_ANSWER = "__lurn_other_answer__";

// Quiz and preference dialogs share Pi's editor surface. Serialize them so
// parallel model tool calls cannot replace one another's open dialog.
const UI_LOCK = Symbol.for("lurn.lesson-interactions.ui-lock");

function withUiLock<T>(run: () => Promise<T>): Promise<T> {
  const state = globalThis as any;
  const lock = (state[UI_LOCK] ??= { tail: Promise.resolve() });
  const previous = lock.tail;
  let release!: () => void;
  lock.tail = new Promise<void>((resolve) => {
    release = resolve;
  });
  return previous.then(run).finally(release);
}

function result(text: string, details: Record<string, unknown>) {
  return { content: [{ type: "text" as const, text }], details };
}

function cleanOptions(options: string[]): string[] {
  return options.map((option) => option.trim()).filter(Boolean);
}

function shuffled<T>(items: T[]): T[] {
  const output = [...items];
  for (let i = output.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [output[i], output[j]] = [output[j], output[i]];
  }
  return output;
}

function renderQuestionCall(label: string, question: string, theme: any): Text {
  // Do not render the answer key or post-answer explanation before the learner
  // submits a choice. Pi may show the complete tool arguments when expanded.
  return new Text(
    `${theme.fg("toolTitle", `${label} `)}${theme.fg("muted", question)}`,
    0,
    0,
  );
}

export default function lessonInteractions(pi: ExtensionAPI) {
  pi.registerTool({
    name: "quiz",
    label: "quiz",
    description:
      "Ask one graded question with a known correct answer, collect the learner's choice, then reveal whether it is correct and explain why. Use this for diagnostics, Socratic steps with a right answer, and checking whether a taught idea landed. Options must be bare claims with parallel wording; put reasoning only in the post-answer explanation. Never use for preferences or other questions without a correct answer.",
    promptSnippet: "Ask one graded question and wait for the learner's answer.",
    promptGuidelines: [
      "Supply the exact correctAnswer option and a concise explanation; both are required.",
      "Use at least two distinct, plausible options. Write them as parallel bare claims with no justifications in the option text.",
      "Make each wrong option a believable misconception and unambiguously wrong on the intended reading.",
      "Use this for every question with a right answer, including Socratic discovery prompts. Use ask_user_question only for genuine preferences or other no-right-answer forks.",
    ],
    executionMode: "sequential",
    parameters: Type.Object({
      question: Type.String({ description: "One question with a right or wrong answer." }),
      options: Type.Array(Type.String(), {
        minItems: 2,
        description: "At least two parallel, bare-claim answer choices.",
      }),
      correctAnswer: Type.String({ description: "Exact text of the correct option." }),
      explanation: Type.String({ description: "Why the correct answer follows; shown after the learner answers." }),
      details: Type.Optional(Type.String({ description: "Optional short context shown with the question." })),
    }),
    async execute(_toolCallId, params, signal, _onUpdate, ctx) {
      const options = cleanOptions(params.options);
      const key = params.correctAnswer.trim();
      const question = params.question.trim();
      const explanation = params.explanation.trim();

      if (!ctx.hasUI) {
        return result("Quiz unavailable: Pi is running without interactive UI. No answer was recorded.", {
          status: "unavailable",
          question,
        });
      }
      if (signal?.aborted) {
        return result("Quiz cancelled before the learner answered.", { status: "cancelled", question });
      }
      if (!question || options.length < 2 || new Set(options).size !== options.length) {
        return result("Quiz unavailable: provide a question and at least two distinct options.", {
          status: "unavailable",
          question,
        });
      }
      if (!options.includes(key) || !explanation) {
        return result("Quiz unavailable: correctAnswer must match one option, and explanation is required.", {
          status: "unavailable",
          question,
        });
      }

      return withUiLock(async () => {
        if (signal?.aborted) {
          return result("Quiz cancelled before the learner answered.", { status: "cancelled", question });
        }
        const visibleOptions = shuffled(options);
        const title = params.details?.trim()
          ? `${question}\n\n${params.details.trim()}`
          : question;
        const selected = await ctx.ui.select(title, visibleOptions);
        if (selected === undefined || signal?.aborted) {
          return result("Quiz cancelled; no answer was recorded.", { status: "cancelled", question });
        }

        const correct = selected === key;
        const text = correct
          ? `Correct. ${explanation}`
          : `Not quite. You chose: ${selected}\nCorrect answer: ${key}\n${explanation}`;
        return result(text, {
          status: "answered",
          question,
          selected,
          correctAnswer: key,
          correct,
          explanation,
        });
      });
    },
    renderCall(args, theme) {
      return renderQuestionCall("quiz", args.question as string, theme);
    },
  });

  pi.registerTool({
    name: "ask_user_question",
    label: "ask_user_question",
    description:
      "Ask exactly one question that has no objectively correct answer, such as a preference, desired scope, or choice of direction. For any question that can be graded right or wrong, use quiz instead.",
    promptSnippet: "Ask one no-right-answer preference or clarification question.",
    promptGuidelines: [
      "Ask exactly one question per call.",
      "Use only for preferences, scope, decisions, or other questions with no objectively correct answer.",
      "If options are supplied, include a way to provide a custom answer.",
      "Use quiz for Socratic prompts and every other question with a correct answer.",
    ],
    executionMode: "sequential",
    parameters: Type.Object({
      question: Type.String({ description: "One preference, scope, or direction question." }),
      options: Type.Optional(Type.Array(Type.String(), { description: "Optional answer choices." })),
      details: Type.Optional(Type.String({ description: "Optional context shown with the question." })),
    }),
    async execute(_toolCallId, params, signal, _onUpdate, ctx) {
      const question = params.question.trim();
      const options = cleanOptions(params.options ?? []);
      if (!ctx.hasUI) {
        return result("Question unavailable: Pi is running without interactive UI.", {
          status: "unavailable",
          question,
        });
      }
      if (signal?.aborted) {
        return result("Question cancelled before the learner answered.", { status: "cancelled", question });
      }

      return withUiLock(async () => {
        if (signal?.aborted) {
          return result("Question cancelled before the learner answered.", { status: "cancelled", question });
        }
        const title = params.details?.trim()
          ? `${question}\n\n${params.details.trim()}`
          : question;
        let answer: string | undefined;
        if (options.length === 0) {
          answer = await ctx.ui.input(title, "Type your answer");
        } else {
          const choice = await ctx.ui.select(title, [...options, OTHER_ANSWER]);
          if (choice === OTHER_ANSWER) {
            answer = await ctx.ui.input("Your answer", "Type a different answer");
          } else {
            answer = choice;
          }
        }

        if (answer === undefined || signal?.aborted) {
          return result("Question cancelled; no answer was recorded.", { status: "cancelled", question });
        }
        return result(`User answered: ${answer}`, { status: "answered", question, answer });
      });
    },
    renderCall(args, theme) {
      return renderQuestionCall("ask_user_question", args.question as string, theme);
    },
  });
}
