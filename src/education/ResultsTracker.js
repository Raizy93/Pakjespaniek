import { SCORING } from '../config/gameConfig.js';

// Houdt alle leerresultaten van één speelronde bij.
export default class ResultsTracker {
  constructor(totalTasks) {
    this.totalTasks = totalTasks;
    this.delivered = 0;
    this.firstTryCorrect = 0;
    this.wrongAnswers = 0;
    this.pepernoten = 0;
    this.pepernotenTotal = 0;
    this.timeMs = 0;
    this.perQuestion = new Map(); // id → { question, attempts, firstWrongAnswer, solved }
  }

  startQuestion(question) {
    if (!this.perQuestion.has(question.id)) {
      this.perQuestion.set(question.id, { question, attempts: 0, firstWrongAnswer: null, solved: false });
    }
  }

  /** @returns {boolean} of het antwoord juist was */
  answer(question, answerText) {
    const rec = this.perQuestion.get(question.id);
    rec.attempts += 1;
    const ok = answerText === question.correct;
    if (ok) {
      if (!rec.solved) {
        rec.solved = true;
        this.delivered += 1;
        if (rec.attempts === 1) this.firstTryCorrect += 1;
      }
    } else {
      this.wrongAnswers += 1;
      if (rec.firstWrongAnswer === null) rec.firstWrongAnswer = answerText;
    }
    return ok;
  }

  get points() {
    return this.delivered * SCORING.pointsPerDelivery + this.pepernoten * SCORING.pointsPerPepernoot;
  }

  get stars() {
    return SCORING.stars(this.firstTryCorrect, this.totalTasks);
  }

  /** Vragen die niet in één keer goed waren, voor het terugkijkscherm */
  get mistakes() {
    return [...this.perQuestion.values()]
      .filter((r) => r.firstWrongAnswer !== null)
      .map((r) => ({
        text: r.question.text,
        prompt: r.question.prompt,
        given: r.firstWrongAnswer,
        correct: r.question.correct,
        explanation: r.question.explanation ?? '',
      }));
  }

  summary() {
    return {
      totalTasks: this.totalTasks,
      delivered: this.delivered,
      firstTryCorrect: this.firstTryCorrect,
      wrongAnswers: this.wrongAnswers,
      pepernoten: this.pepernoten,
      pepernotenTotal: this.pepernotenTotal,
      timeMs: this.timeMs,
      points: this.points,
      stars: this.stars,
      mistakes: this.mistakes,
    };
  }
}
