"use client";

import type { CSSProperties, SyntheticEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { RewindGroup, SurveyQuestion, VoteOption } from "@/src/tronnies/rewindData2025";
import { REWIND_2025_QUESTIONS } from "@/src/tronnies/rewindData2025";

interface QuestionSummary {
  question: SurveyQuestion;
  winners: VoteOption[];
  runnerUp: VoteOption | null;
  margin: number;
  topThree: VoteOption[];
}

interface GroupSummary {
  key: RewindGroup;
  label: string;
  questions: QuestionSummary[];
}

type RewindSlide =
  | { type: "hero" }
  | { type: "category"; group: GroupSummary }
  | { type: "question"; group: GroupSummary; summary: QuestionSummary }
  | { type: "outro" };

const GROUP_LABELS: Record<RewindGroup, string> = {
  playstyle: "playstyle",
  personality: "personality",
  fortress: "fortress",
  sumo: "sumo"
};

const NAME_ALIASES: Record<string, string> = {
  Apple: "apple",
  Kronkleberry: "kronkleberry",
  Ellis: "ellis",
  Elis: "ellis",
  Pizza: "pizza",
  TJ: "tj",
  Tj: "tj",
  Olive: "olive",
  Koala: "koala",
  Magi: "magi",
  Morbit: "morbit",
  Wolf: "wolf",
  Orly: "orly",
  Melon: "melon",
  Deli: "delinquent",
  JZ: "Jz",
  Mixmaxx: "Mikemacx",
  Fin: "Fini",
  Mr: "mr"
};

const GROUP_HUES: Record<RewindGroup, number> = {
  playstyle: 280,
  personality: 332,
  fortress: 205,
  sumo: 128
};

const samePercent = (a: number, b: number) => Math.abs(a - b) < 0.01;

const normalizePlayerName = (name: string) =>
  name
    .split(/\s+and\s+/i)
    .map((part) => NAME_ALIASES[part] ?? part)
    .join(" and ");

const normalizeOption = (option: VoteOption): VoteOption => ({
  ...option,
  name: normalizePlayerName(option.name)
});

const summarizeQuestion = (question: SurveyQuestion): QuestionSummary => {
  const sorted = [...question.options].map(normalizeOption).sort((a, b) => b.percent - a.percent);
  const topPercent = sorted[0]?.percent ?? 0;
  const winners = sorted.filter((option) => samePercent(option.percent, topPercent) && option.percent > 0);
  const runnerUp = sorted.find((option) => !samePercent(option.percent, topPercent)) ?? null;
  return {
    question,
    winners,
    runnerUp,
    margin: Math.max(0, topPercent - (runnerUp?.percent ?? 0)),
    topThree: sorted.slice(0, 3)
  };
};

const winnerText = (summary: QuestionSummary) =>
  summary.winners.length > 1 ? `${summary.winners.map((entry) => entry.name).join(" + ")} (tie)` : summary.winners[0]?.name ?? "TBD";

const slugifyPlayer = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const estimatedVotes = (responses: number, percent: number) => Math.round((responses * percent) / 100);

const PNG_PROFILE_SLUGS = new Set(["ellis", "force", "tj"]);

const PROFILE_OVERRIDES: Record<string, string> = {
  mr: "ellis.png",
  "ninja-potato": "ninjapotato.webp",
  deli: "delinquent.webp"
};

const profileImageSrc = (playerName: string) => {
  const slug = slugifyPlayer(playerName);
  const override = PROFILE_OVERRIDES[slug];
  if (override) {
    return `/images/profiles/${override}`;
  }
  const ext = PNG_PROFILE_SLUGS.has(slug) ? "png" : "webp";
  return `/images/profiles/${slug}.${ext}`;
};

const profileImageSet = (playerName: string) =>
  playerName.split(/\s+and\s+/i).map((part) => {
    const name = part.trim();
    return { name, src: profileImageSrc(name) };
  });

const handleAvatarError = (event: SyntheticEvent<HTMLImageElement>) => {
  const img = event.currentTarget;
  if (img.dataset.fallbackApplied === "1") {
    return;
  }
  img.dataset.fallbackApplied = "1";
  img.src = "/images/profiles/ellis.png";
};

export function Tronnies2025Page() {
  const reduceMotion = useReducedMotion();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);
  const [hasEntered, setHasEntered] = useState(false);
  const lastWheelTimeRef = useRef(0);
  const rewindRootRef = useRef<HTMLDivElement>(null);

  const summaries = useMemo(() => REWIND_2025_QUESTIONS.map(summarizeQuestion), []);
  const totalResponses = useMemo(() => REWIND_2025_QUESTIONS.reduce((sum, entry) => sum + entry.responses, 0), []);

  const groups = useMemo<GroupSummary[]>(() => {
    const grouped: Record<RewindGroup, QuestionSummary[]> = {
      playstyle: [],
      personality: [],
      fortress: [],
      sumo: []
    };
    summaries.forEach((entry) => grouped[entry.question.group].push(entry));
    return (Object.keys(grouped) as RewindGroup[]).map((group) => ({
      key: group,
      label: GROUP_LABELS[group],
      questions: grouped[group]
    }));
  }, [summaries]);

  const slides = useMemo<RewindSlide[]>(() => {
    const collection: RewindSlide[] = [{ type: "hero" }];
    groups.forEach((group) => {
      collection.push({ type: "category", group });
      group.questions.forEach((summary) => collection.push({ type: "question", group, summary }));
    });
    collection.push({ type: "outro" });
    return collection;
  }, [groups]);

  const goNext = () => {
    setDirection(1);
    setCurrentSlide((index) => Math.min(slides.length - 1, index + 1));
  };

  const goPrev = () => {
    setDirection(-1);
    setCurrentSlide((index) => Math.max(0, index - 1));
  };

  useEffect(() => {
    if (hasEntered) {
      document.body.classList.add("rewind-route-active");
    } else {
      document.body.classList.remove("rewind-route-active");
    }
    return () => document.body.classList.remove("rewind-route-active");
  }, [hasEntered]);

  useEffect(() => {
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setHasEntered(false);
      }
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  useEffect(() => {
    if (!hasEntered) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight" || event.key === " " || event.key === "Enter") {
        event.preventDefault();
        goNext();
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
      }
    };

    const onWheel = (event: WheelEvent) => {
      const now = Date.now();
      if (Math.abs(event.deltaY) < 25 || now - lastWheelTimeRef.current < 360) {
        return;
      }
      event.preventDefault();
      lastWheelTimeRef.current = now;
      if (event.deltaY > 0) {
        goNext();
      } else {
        goPrev();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("wheel", onWheel);
    };
  }, [hasEntered, slides.length]);

  const startExperience = async () => {
    const root = rewindRootRef.current;
    try {
      if (root && document.fullscreenElement !== root) {
        await root.requestFullscreen();
      }
    } catch {
      // Continue even if browser blocks fullscreen.
    }
    setHasEntered(true);
  };

  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } finally {
      setHasEntered(false);
    }
  };

  const activeSlide = slides[currentSlide];
  const progressValue = ((currentSlide + 1) / slides.length) * 100;
  const activeGroup =
    activeSlide.type === "category" || activeSlide.type === "question" ? activeSlide.group.key : (slides.find((slide) => slide.type === "category") as Extract<RewindSlide, { type: "category" }>).group.key;
  const backgroundHue = GROUP_HUES[activeGroup];
  const motionVariants = {
    enter: (dir: number) => (reduceMotion ? { opacity: 0 } : { opacity: 0, x: dir > 0 ? 140 : -140, scale: 0.985 }),
    center: { opacity: 1, x: 0, scale: 1 },
    exit: (dir: number) => (reduceMotion ? { opacity: 0 } : { opacity: 0, x: dir > 0 ? -140 : 140, scale: 0.985 })
  };

  if (!hasEntered) {
    return (
      <main ref={rewindRootRef} className="rewind-root rewind-entry" style={{ "--rewind-hue": GROUP_HUES.playstyle } as CSSProperties}>
        <div className="rewind-entry-shell">
          <p className="rewind-kicker">retrocycles league</p>
          <h1 className="rewind-title">tronnies 2025 rewind</h1>
          <p className="rewind-subtitle">tap once to enter fullscreen and start the slideshow experience.</p>
          <button type="button" className="rewind-enter-fullscreen-btn" onClick={startExperience}>
            enter fullscreen
          </button>
        </div>
      </main>
    );
  }

  return (
    <main ref={rewindRootRef} className="rewind-root" style={{ "--rewind-hue": backgroundHue } as CSSProperties}>
      <button type="button" className="rewind-exit-fullscreen" onClick={exitFullscreen} aria-label="exit fullscreen mode">
        <span className="rewind-exit-fullscreen-glyph">⛶</span>
      </button>
      <div className="rewind-progress-shell" aria-hidden="true">
        <div className="rewind-progress-track">
          <div className="rewind-progress-fill" style={{ width: `${progressValue}%` }} />
        </div>
        <div className="rewind-progress-label">
          {currentSlide + 1}/{slides.length}
        </div>
      </div>

      <AnimatePresence custom={direction} mode="wait">
        <motion.section
          key={currentSlide}
          className="rewind-slide"
          custom={direction}
          variants={motionVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: reduceMotion ? 0.15 : 0.4, ease: "easeOut" }}
        >
          {activeSlide.type === "hero" && (
            <div className="rewind-hero">
              <p className="rewind-kicker">retrocycles league</p>
              <h1 className="rewind-title">tronnies 2025 rewind</h1>
              <p className="rewind-subtitle">voted by players, remembered by everyone.</p>
              <button type="button" className="rewind-cta" onClick={goNext}>
                start rewind
              </button>
            </div>
          )}

          {activeSlide.type === "category" && (
            <div className="rewind-stack">
              <div className="rewind-category-center">
                <h2 className="rewind-title">{activeSlide.group.label}</h2>
                <p className="rewind-subtitle">{activeSlide.group.questions.length} subcategories · {activeSlide.group.questions.reduce((sum, entry) => sum + entry.question.responses, 0)} responses</p>
              </div>
            </div>
          )}

          {activeSlide.type === "question" && (
            <div className="rewind-stack">
              {(() => {
                const showPodiumAvatars = activeSlide.summary.question.title.toLowerCase() !== "best meme / instant chat";
                const rankedTopThree = activeSlide.summary.topThree.map((option) => ({
                  option,
                  rank: 1 + activeSlide.summary.question.options.filter((raw) => normalizeOption(raw).percent > option.percent).length
                }));
                const secondEntry = rankedTopThree[1];
                const firstEntry = rankedTopThree[0];
                const thirdEntry = rankedTopThree[2];
                const rankClass = (rank: number) => (rank === 1 ? "rewind-podium-gold" : rank === 2 ? "rewind-podium-silver" : "rewind-podium-bronze");
                return (
                  <>
              <div className="rewind-question-head">
                <p className="rewind-kicker">{activeSlide.group.label}</p>
                <h2 className="rewind-slide-title">{activeSlide.summary.question.title.toLowerCase()}</h2>
                <p className="rewind-note">{activeSlide.summary.question.responses} responses · margin {activeSlide.summary.margin.toFixed(1)}%</p>
              </div>
              <div className="rewind-podium-shell" aria-label="top three podium">
                {secondEntry && (
                  <motion.article
                    className={`rewind-podium-card rewind-podium-left ${rankClass(secondEntry.rank)}`}
                    initial={{ opacity: 0, y: 56, scale: 0.86, filter: "blur(8px)" }}
                    animate={{ opacity: 1, y: 0, scale: [1.03, 1], filter: "blur(0px)" }}
                    transition={{ duration: 0.62, delay: 0.62, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {showPodiumAvatars && (
                      <div className={`rewind-podium-avatars ${profileImageSet(secondEntry.option.name).length > 1 ? "is-duo" : ""}`}>
                        {profileImageSet(secondEntry.option.name).map((avatar) => (
                          <div key={`${activeSlide.summary.question.id}-second-${avatar.name}`} className="rewind-podium-avatar-wrap">
                            <img className="rewind-podium-avatar" src={avatar.src} alt={avatar.name} onError={handleAvatarError} />
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="rewind-podium-rank">#{secondEntry.rank}</div>
                    <div className="rewind-podium-name">{secondEntry.option.name}</div>
                    <div className="rewind-podium-percent">{secondEntry.option.percent.toFixed(1)}%</div>
                    <div className="rewind-podium-votes">{estimatedVotes(activeSlide.summary.question.responses, secondEntry.option.percent)} votes</div>
                  </motion.article>
                )}
                {firstEntry && (
                  <motion.article
                    className={`rewind-podium-card rewind-podium-center ${rankClass(firstEntry.rank)}`}
                    initial={{ opacity: 0, y: 80, scale: 0.82, filter: "blur(10px)" }}
                    animate={{ opacity: 1, y: 0, scale: [1.08, 1], filter: "blur(0px)" }}
                    transition={{ duration: 0.78, delay: 1.28, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {showPodiumAvatars && (
                      <div className={`rewind-podium-avatars ${profileImageSet(firstEntry.option.name).length > 1 ? "is-duo" : ""}`}>
                        {profileImageSet(firstEntry.option.name).map((avatar) => (
                          <div key={`${activeSlide.summary.question.id}-first-${avatar.name}`} className="rewind-podium-avatar-wrap">
                            <img className="rewind-podium-avatar" src={avatar.src} alt={avatar.name} onError={handleAvatarError} />
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="rewind-podium-rank">#{firstEntry.rank}</div>
                    <div className="rewind-podium-name">{firstEntry.option.name}</div>
                    <div className="rewind-podium-percent">{firstEntry.option.percent.toFixed(1)}%</div>
                    <div className="rewind-podium-votes">{estimatedVotes(activeSlide.summary.question.responses, firstEntry.option.percent)} votes</div>
                  </motion.article>
                )}
                {thirdEntry && (
                  <motion.article
                    className={`rewind-podium-card rewind-podium-right ${rankClass(thirdEntry.rank)}`}
                    initial={{ opacity: 0, y: 64, scale: 0.84, filter: "blur(9px)" }}
                    animate={{ opacity: 1, y: 0, scale: [1.02, 1], filter: "blur(0px)" }}
                    transition={{ duration: 0.58, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {showPodiumAvatars && (
                      <div className={`rewind-podium-avatars ${profileImageSet(thirdEntry.option.name).length > 1 ? "is-duo" : ""}`}>
                        {profileImageSet(thirdEntry.option.name).map((avatar) => (
                          <div key={`${activeSlide.summary.question.id}-third-${avatar.name}`} className="rewind-podium-avatar-wrap">
                            <img className="rewind-podium-avatar" src={avatar.src} alt={avatar.name} onError={handleAvatarError} />
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="rewind-podium-rank">#{thirdEntry.rank}</div>
                    <div className="rewind-podium-name">{thirdEntry.option.name}</div>
                    <div className="rewind-podium-percent">{thirdEntry.option.percent.toFixed(1)}%</div>
                    <div className="rewind-podium-votes">{estimatedVotes(activeSlide.summary.question.responses, thirdEntry.option.percent)} votes</div>
                  </motion.article>
                )}
              </div>
              <div className="rewind-bottom-strip">
                <span>winner: {winnerText(activeSlide.summary)}</span>
                <span>
                  runner-up: {activeSlide.summary.runnerUp?.name ?? "n/a"}
                </span>
                <span>slides: {currentSlide + 1}/{slides.length}</span>
              </div>
                  </>
                );
              })()}
            </div>
          )}

          {activeSlide.type === "outro" && (
            <div className="rewind-hero">
              <p className="rewind-kicker">tronnies 2025</p>
              <h2 className="rewind-title">that was the rewind.</h2>
              <p className="rewind-subtitle">
                37 prompts · {totalResponses} responses · thanks to everyone who voted.
              </p>
              <button type="button" className="rewind-cta" onClick={() => setCurrentSlide(0)}>
                replay
              </button>
              <Link href="/" className="rewind-cta rewind-hub-link">
                back to hub
              </Link>
            </div>
          )}

          <button type="button" className="rewind-side-arrow rewind-side-arrow-left" aria-label="previous slide" onClick={goPrev} disabled={currentSlide === 0}>
            <span className="rewind-side-arrow-glyph">←</span>
          </button>
          <button type="button" className="rewind-side-arrow rewind-side-arrow-right" aria-label="next slide" onClick={goNext} disabled={currentSlide >= slides.length - 1}>
            <span className="rewind-side-arrow-glyph">→</span>
          </button>
        </motion.section>
      </AnimatePresence>
    </main>
  );
}
