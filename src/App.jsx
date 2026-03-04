import React, { useEffect, useMemo, useRef, useState } from "react";


function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function loadLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function saveLS(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    
  }
}

function todayKey() {
  const d = new Date();
  
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}


const TABS = [
  { id: "home", label: "Home" },
  { id: "map", label: "Map Explorer" },
  { id: "mood", label: "Mood Check-in" },
  { id: "breathe", label: "Nature Breathing" },
  { id: "sounds", label: "Calm Sounds" },
  { id: "hunt", label: "Scavenger Hunt" },
  { id: "quiz", label: "Mini Quiz" },
  { id: "dashboard", label: "Dashboard" },
];

const mapPlaces = [
  {
    id: "farm",
    title: "Farm",
    emoji: "🚜",
    what: "Farms grow food and care for animals. Farmers help feed everyone.",
    mental: "Seeing where food comes from can make you feel more confident and curious.",
    tryIt: "Spot 3 foods that come from farms (milk, bread, apples…).",
    funFact: "Soil is alive — it can be full of tiny helpful organisms!",
  },
  {
    id: "woodland",
    title: "Woodland",
    emoji: "🌳",
    what: "Woodlands are full of trees, birds, insects, and shade.",
    mental: "Green spaces can help your brain feel less busy and more calm.",
    tryIt: "Do a ‘5-4-3-2-1’: 5 things you see, 4 feel, 3 hear, 2 smell, 1 taste.",
    funFact: "Trees can help clean the air by taking in carbon dioxide.",
  },
  {
    id: "river",
    title: "River",
    emoji: "🏞️",
    what: "Rivers move water through the countryside and support wildlife.",
    mental: "Water sounds can be soothing and help you relax.",
    tryIt: "Listen for 10 seconds. How many different water sounds can you notice?",
    funFact: "Some rivers change shape over time, making new bends called meanders.",
  },
  {
    id: "meadow",
    title: "Meadow",
    emoji: "🌼",
    what: "Meadows can be full of wildflowers and pollinators like bees.",
    mental: "Noticing small details can lower stress and boost focus.",
    tryIt: "Find 2 different flower shapes (or leaf shapes) and compare them.",
    funFact: "Bees help plants make seeds by moving pollen between flowers.",
  },
];

const huntItemsDefault = [
  { id: "bird", label: "Hear a bird sing 🐦", done: false },
  { id: "leaf", label: "Find a leaf with a cool shape 🍃", done: false },
  { id: "cloud", label: "Spot a cloud that looks like something ☁️", done: false },
  { id: "sound", label: "Close your eyes: name 3 sounds 👂", done: false },
  { id: "steps", label: "Walk 300 steps 🚶", done: false },
  { id: "kind", label: "Do one kind thing for nature (pick up litter / shut a gate) ♻️", done: false },
];

const quizQuestions = [
  {
    q: "Which can help your mood and sleep routine?",
    options: ["Daylight ☀️", "Never going outside", "Skipping all movement"],
    answerIndex: 0,
    explain: "Daylight supports your body clock and can help mood.",
  },
  {
    q: "What’s a good way to calm your brain outdoors?",
    options: ["Noticing 3 sounds 👂", "Rushing and not looking", "Only staring at a screen"],
    answerIndex: 0,
    explain: "Noticing sounds helps your brain slow down and focus.",
  },
  {
    q: "If a challenge feels hard, what helps most?",
    options: ["Try, learn, try again 💪", "Give up instantly", "Hide the problem"],
    answerIndex: 0,
    explain: "Progress often comes from small attempts and learning.",
  },
];


export default function App() {
  const [tab, setTab] = useState("home");

  
  const [moodLog, setMoodLog] = useState(() =>
    loadLS("cb_moodLog", [
      
    ])
  );

  const [moodBefore, setMoodBefore] = useState(3);
  const [moodAfter, setMoodAfter] = useState(3);

  const [huntItems, setHuntItems] = useState(() => loadLS("cb_huntItems", huntItemsDefault));
  const [visitedPlaces, setVisitedPlaces] = useState(() => loadLS("cb_visitedPlaces", {})); // { farm: true, ... }
  const [activityLog, setActivityLog] = useState(() => loadLS("cb_activityLog", [])); // {date, type}


  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(() => loadLS("cb_quizHighScore", 0));
  const [runScore, setRunScore] = useState(0);
  const [showExplain, setShowExplain] = useState(false);

 
  const [breathing, setBreathing] = useState(false);
  const [breathPhase, setBreathPhase] = useState("Ready");
  const [breathCount, setBreathCount] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);

 
  const birdsRef = useRef(null);
  const windRef = useRef(null);
  const [soundNow, setSoundNow] = useState("none"); 


  useEffect(() => saveLS("cb_moodLog", moodLog), [moodLog]);
  useEffect(() => saveLS("cb_huntItems", huntItems), [huntItems]);
  useEffect(() => saveLS("cb_visitedPlaces", visitedPlaces), [visitedPlaces]);
  useEffect(() => saveLS("cb_activityLog", activityLog), [activityLog]);
  useEffect(() => saveLS("cb_quizHighScore", score), [score]);

 
  useEffect(() => {
    if (!breathing) return;

    const plan = [
      { label: "Inhale…", seconds: 4 },
      { label: "Hold…", seconds: 2 },
      { label: "Exhale…", seconds: 6 },
    ];

    let phaseIndex = 0;
    let remaining = plan[phaseIndex].seconds;
    setBreathPhase(plan[phaseIndex].label);
    setSecondsLeft(remaining);

    const interval = setInterval(() => {
      remaining -= 1;

      if (remaining <= 0) {
        phaseIndex += 1;

        if (phaseIndex >= plan.length) {
          setBreathCount((c) => c + 1);
          phaseIndex = 0;
        }

        remaining = plan[phaseIndex].seconds;
        setBreathPhase(plan[phaseIndex].label);
        setSecondsLeft(remaining);
        return;
      }

      setSecondsLeft(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [breathing]);

  useEffect(() => {
    if (breathing && breathCount >= 5) {
      setBreathing(false);
      setBreathPhase("Great job! 🌿");
      setSecondsLeft(0);
      addActivity("breathing");
    }
  }, [breathCount, breathing]);

  const addActivity = (type) => {
    const entry = { date: todayKey(), type };
    setActivityLog((prev) => [entry, ...prev].slice(0, 200));
  };

  const moodMessage = useMemo(() => {
    const diff = moodAfter - moodBefore;
    if (diff >= 2) return "Big boost! 🌈";
    if (diff === 1) return "Nice — a bit brighter 🌤️";
    if (diff === 0) return "Steady — that’s okay 💛";
    if (diff === -1) return "A bit tougher — be kind to yourself 🫶";
    return "Feeling lower — you deserve support 💙";
  }, [moodBefore, moodAfter]);

  const saveMoodToday = () => {
    const date = todayKey();
    setMoodLog((prev) => {
      const withoutToday = prev.filter((m) => m.date !== date);
      return [{ date, before: moodBefore, after: moodAfter }, ...withoutToday].slice(0, 60);
    });
    addActivity("mood-check");
  };

  const toggleHunt = (id) => {
    setHuntItems((items) =>
      items.map((it) => (it.id === id ? { ...it, done: !it.done } : it))
    );
  };

  const huntDoneCount = huntItems.filter((x) => x.done).length;
  const huntComplete = huntDoneCount === huntItems.length;

  useEffect(() => {
    if (huntComplete) addActivity("scavenger-hunt");
   
  }, [huntComplete]);

  const resetHunt = () => setHuntItems(huntItemsDefault);

  const visitPlace = (id) => {
    setVisitedPlaces((prev) => ({ ...prev, [id]: true }));
    addActivity(`map:${id}`);
  };


  const q = quizQuestions[qIndex];
  const chooseOption = (idx) => {
    if (selected !== null) return;
    setSelected(idx);
    const correct = idx === q.answerIndex;
    if (correct) setRunScore((s) => s + 1);
    setShowExplain(true);
  };

  const nextQuestion = () => {
    setSelected(null);
    setShowExplain(false);
    setQIndex((i) => i + 1);
  };

  const restartQuiz = () => {
    setQIndex(0);
    setSelected(null);
    setShowExplain(false);
    setRunScore(0);
  };

  useEffect(() => {
    if (qIndex === quizQuestions.length && runScore > score) {
      setScore(runScore);
      addActivity("quiz-highscore");
    }
   
  }, [qIndex]);

 
  const stopAllSounds = () => {
    [birdsRef.current, windRef.current].forEach((a) => {
      if (a) {
        a.pause();
        a.currentTime = 0;
      }
    });
    setSoundNow("none");
  };

  const playSound = async (which) => {
    stopAllSounds();
    const audio = which === "birds" ? birdsRef.current : windRef.current;
    if (!audio) return;

    try {
      await audio.play();
      setSoundNow(which);
      addActivity(`sound:${which}`);
    } catch {
    
      setSoundNow("none");
    }
  };

  const dashboard = useMemo(() => {
    const placesVisitedCount = Object.values(visitedPlaces).filter(Boolean).length;

    const last7 = moodLog
      .slice()
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, 7);

    const lastActivity = activityLog[0];

    const streak = computeStreak(activityLog);

    return {
      placesVisitedCount,
      huntDoneCount,
      huntTotal: huntItems.length,
      highScore: score,
      last7,
      lastActivity,
      streak,
    };
  }, [visitedPlaces, huntDoneCount, huntItems.length, score, moodLog, activityLog]);

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.titleRow}>
          <div style={styles.logo} aria-hidden="true">
            🌾
          </div>
          <div>
            <h1 style={styles.h1}>Countryside Buddy</h1>
            <p style={styles.sub}>
              For ages 9–12: explore nature + learn how it helps your mind feel better.
            </p>
          </div>
        </div>

        <nav style={styles.nav} aria-label="App sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                ...styles.tabBtn,
                ...(tab === t.id ? styles.tabBtnActive : {}),
              }}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main style={styles.main}>
        {tab === "home" && (
          <section style={styles.card}>
            <h2 style={styles.h2}>Welcome 👋</h2>
            <p style={styles.p}>
              Pick an activity. Try the Map Explorer first — it’s like a mini adventure.
            </p>

            <div style={styles.grid}>
              <MiniCard
                title="Map Explorer"
                emoji="🗺️"
                text="Tap places (farm, woodland, river…) and unlock facts!"
                onClick={() => setTab("map")}
              />
              <MiniCard
                title="Mood Check-in"
                emoji="💛"
                text="See how activities change how you feel."
                onClick={() => setTab("mood")}
              />
              <MiniCard
                title="Calm Sounds"
                emoji="🎧"
                text="Birdsong or wind — great for focus or relaxing."
                onClick={() => setTab("sounds")}
              />
              <MiniCard
                title="Scavenger Hunt"
                emoji="🔎"
                text="Outdoor checklist you can do in a park too."
                onClick={() => setTab("hunt")}
              />
              <MiniCard
                title="Nature Breathing"
                emoji="🌬️"
                text="5 calm cycles — quick reset for your brain."
                onClick={() => setTab("breathe")}
              />
              <MiniCard
                title="Dashboard"
                emoji="📊"
                text="See progress (great for parents/teachers)."
                onClick={() => setTab("dashboard")}
              />
            </div>

            <div style={styles.note}>
              <strong>Safety tip:</strong> Always go outside with permission and stay safe near roads/water.
            </div>
          </section>
        )}

        {tab === "map" && (
          <section style={styles.card}>
            <h2 style={styles.h2}>Map Explorer 🗺️</h2>
            <p style={styles.p}>
              Tap a place to unlock a badge and learn how it helps your mind.
            </p>

            <div style={styles.mapGrid}>
              {mapPlaces.map((pl) => {
                const visited = !!visitedPlaces[pl.id];
                return (
                  <button
                    key={pl.id}
                    onClick={() => visitPlace(pl.id)}
                    style={{
                      ...styles.mapTile,
                      ...(visited ? styles.mapTileVisited : {}),
                    }}
                    aria-label={`Open ${pl.title}`}
                  >
                    <div style={styles.mapEmoji} aria-hidden="true">
                      {pl.emoji}
                    </div>
                    <div style={styles.mapTitle}>
                      {pl.title} {visited ? "✓" : ""}
                    </div>
                    <div style={styles.mapHint}>
                      {visited ? "Unlocked!" : "Tap to explore"}
                    </div>
                  </button>
                );
              })}
            </div>

            <div style={styles.grid}>
              {mapPlaces.map((pl) =>
                visitedPlaces[pl.id] ? (
                  <PlaceCard key={pl.id} place={pl} />
                ) : null
              )}
            </div>

            <div style={styles.actions}>
              <button style={styles.secondary} onClick={() => setTab("hunt")}>
                Do scavenger hunt 🔎
              </button>
              <button style={styles.secondary} onClick={() => setTab("mood")}>
                Check mood 💛
              </button>
            </div>
          </section>
        )}

        {tab === "mood" && (
          <section style={styles.card}>
            <h2 style={styles.h2}>Mood Check-in 💛</h2>
            <p style={styles.p}>
              Slide “Before”, do an activity, then slide “After”. Save today’s check-in.
            </p>

            <div style={styles.row}>
              <div style={styles.block}>
                <label style={styles.label}>Before</label>
                <MoodSlider value={moodBefore} onChange={setMoodBefore} />
              </div>
              <div style={styles.block}>
                <label style={styles.label}>After</label>
                <MoodSlider value={moodAfter} onChange={setMoodAfter} />
              </div>
            </div>

            <div style={styles.result}>
              <div style={styles.resultBig}>{moodMessage}</div>
              <div style={styles.resultSmall}>
                Before: {moodBefore}/5 • After: {moodAfter}/5
              </div>
            </div>

            <div style={styles.actions}>
              <button style={styles.primary} onClick={saveMoodToday}>
                Save today’s check-in
              </button>
              <button style={styles.secondary} onClick={() => setTab("breathe")}>
                Try breathing 🌬️
              </button>
              <button style={styles.secondary} onClick={() => setTab("sounds")}>
                Play calm sounds 🎧
              </button>
            </div>
          </section>
        )}

        {tab === "breathe" && (
          <section style={styles.card}>
            <h2 style={styles.h2}>Nature Breathing 🌿</h2>
            <p style={styles.p}>
              Do 5 cycles: Inhale 4 • Hold 2 • Exhale 6. Imagine wind moving through trees.
            </p>

            <div style={styles.breatheBox} aria-live="polite">
              <div style={styles.breathePhase}>{breathPhase}</div>
              {breathing && <div style={styles.breatheTime}>{secondsLeft}s</div>}
              {!breathing && breathPhase !== "Ready" && <div style={styles.breatheTime}>✓</div>}
              <div style={styles.breatheSmall}>Cycles: {breathCount}/5</div>
            </div>

            <div style={styles.actions}>
              {!breathing ? (
                <button style={styles.primary} onClick={() => setBreathing(true)}>
                  Start
                </button>
              ) : (
                <button style={styles.secondary} onClick={() => setBreathing(false)}>
                  Pause
                </button>
              )}
              <button style={styles.secondary} onClick={() => resetBreathing(setBreathCount, setBreathPhase, setSecondsLeft, setBreathing)}>
                Reset
              </button>
              <button style={styles.secondary} onClick={() => setTab("mood")}>
                Check mood 💛
              </button>
            </div>
          </section>
        )}

        {tab === "sounds" && (
          <section style={styles.card}>
            <h2 style={styles.h2}>Calm Sounds 🎧</h2>
            <p style={styles.p}>
              Use these while you read, relax, or do breathing. (Requires audio files in <code>public/audio</code>.)
            </p>

            <audio ref={birdsRef} src="/audio/birds.mp3" preload="auto" />
            <audio ref={windRef} src="/audio/wind.mp3" preload="auto" />

            <div style={styles.soundRow}>
              <button style={styles.primary} onClick={() => playSound("birds")}>
                Play birds 🐦
              </button>
              <button style={styles.primary} onClick={() => playSound("wind")}>
                Play wind 🌬️
              </button>
              <button style={styles.secondary} onClick={stopAllSounds}>
                Stop ⏹️
              </button>
            </div>

            <div style={styles.note}>
              <strong>Now playing:</strong>{" "}
              {soundNow === "none" ? "Nothing" : soundNow === "birds" ? "Birds" : "Wind"}
            </div>

            <div style={styles.actions}>
              <button style={styles.secondary} onClick={() => setTab("breathe")}>
                Pair with breathing 🌿
              </button>
              <button style={styles.secondary} onClick={() => setTab("map")}>
                Explore the map 🗺️
              </button>
            </div>
          </section>
        )}

        {tab === "hunt" && (
          <section style={styles.card}>
            <h2 style={styles.h2}>Scavenger Hunt 🔎</h2>
            <p style={styles.p}>
              Tick them off in a garden, park, or countryside walk. Progress saves automatically.
            </p>

            <div style={styles.huntProgress}>
              <strong>
                Progress: {huntDoneCount}/{huntItems.length}
              </strong>
              {huntComplete && <span style={styles.badge}>Complete! 🎉</span>}
            </div>

            <div style={styles.huntList}>
              {huntItems.map((it) => (
                <label key={it.id} style={styles.huntItem}>
                  <input
                    type="checkbox"
                    checked={it.done}
                    onChange={() => toggleHunt(it.id)}
                  />
                  <span
                    style={{
                      marginLeft: 10,
                      textDecoration: it.done ? "line-through" : "none",
                    }}
                  >
                    {it.label}
                  </span>
                </label>
              ))}
            </div>

            <div style={styles.actions}>
              <button style={styles.primary} onClick={() => setTab("mood")}>
                Check your mood 💛
              </button>
              <button style={styles.secondary} onClick={resetHunt}>
                Reset list
              </button>
              <button style={styles.secondary} onClick={() => setTab("quiz")}>
                Try the quiz 🧠
              </button>
            </div>
          </section>
        )}

        {tab === "quiz" && (
          <section style={styles.card}>
            <h2 style={styles.h2}>Mini Quiz 🧠</h2>
            <p style={styles.p}>
              No pressure — just learning. High score: <strong>{score}</strong>
            </p>

            {qIndex < quizQuestions.length ? (
              <div>
                <div style={styles.quizQ}>
                  <strong>Q{qIndex + 1}:</strong> {q.q}
                </div>

                <div style={styles.quizOptions}>
                  {q.options.map((opt, idx) => {
                    const chosen = selected === idx;
                    const correct = idx === q.answerIndex;
                    const show = selected !== null;
                    return (
                      <button
                        key={opt}
                        onClick={() => chooseOption(idx)}
                        style={{
                          ...styles.optionBtn,
                          ...(chosen ? styles.optionBtnChosen : {}),
                          ...(show && correct ? styles.optionBtnCorrect : {}),
                          ...(show && chosen && !correct ? styles.optionBtnWrong : {}),
                        }}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {showExplain && (
                  <div style={styles.explain}>
                    {selected === q.answerIndex ? "Nice! ✅ " : "Good try! 💛 "}
                    {q.explain}
                  </div>
                )}

                <div style={styles.actions}>
                  <button
                    style={styles.primary}
                    onClick={nextQuestion}
                    disabled={selected === null}
                  >
                    Next
                  </button>
                  <button style={styles.secondary} onClick={() => setTab("map")}>
                    Explore map 🗺️
                  </button>
                </div>
              </div>
            ) : (
              <div style={styles.result}>
                <div style={styles.resultBig}>
                  You scored {runScore}/{quizQuestions.length}! 🎉
                </div>
                <div style={styles.resultSmall}>
                  High score: {Math.max(score, runScore)}
                </div>
                <div style={styles.actions}>
                  <button style={styles.primary} onClick={() => { addActivity("quiz"); restartQuiz(); }}>
                    Play again
                  </button>
                  <button style={styles.secondary} onClick={() => setTab("dashboard")}>
                    See dashboard 📊
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {tab === "dashboard" && (
          <section style={styles.card}>
            <h2 style={styles.h2}>Parent/Teacher Dashboard 📊</h2>
            <p style={styles.p}>
              A quick view of progress. (Everything stays on this device.)
            </p>

            <div style={styles.dashGrid}>
              <DashStat label="Map places unlocked" value={`${dashboard.placesVisitedCount}/${mapPlaces.length}`} />
              <DashStat label="Hunt progress" value={`${dashboard.huntDoneCount}/${dashboard.huntTotal}`} />
              <DashStat label="Quiz high score" value={`${dashboard.highScore}/${quizQuestions.length}`} />
              <DashStat label="Activity streak" value={`${dashboard.streak} day(s)`} />
            </div>

            <div style={styles.grid}>
              <div style={styles.panel}>
                <h3 style={styles.h3}>Mood (last 7 check-ins)</h3>
                {dashboard.last7.length === 0 ? (
                  <p style={styles.p}>No mood check-ins saved yet.</p>
                ) : (
                  <div style={styles.moodTable}>
                    <div style={styles.moodRowHead}>
                      <span>Date</span><span>Before</span><span>After</span>
                    </div>
                    {dashboard.last7.map((m) => (
                      <div key={m.date} style={styles.moodRow}>
                        <span>{m.date}</span>
                        <span>{m.before}/5</span>
                        <span>{m.after}/5</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={styles.panel}>
                <h3 style={styles.h3}>Recent activity</h3>
                {dashboard.lastActivity ? (
                  <p style={styles.p}>
                    <strong>Latest:</strong> {prettyActivity(dashboard.lastActivity.type)} ({dashboard.lastActivity.date})
                  </p>
                ) : (
                  <p style={styles.p}>No activity recorded yet.</p>
                )}

                <button
                  style={styles.secondary}
                  onClick={() => {
                    if (confirm("This will clear all saved progress on this device. Continue?")) {
                      localStorage.removeItem("cb_moodLog");
                      localStorage.removeItem("cb_huntItems");
                      localStorage.removeItem("cb_visitedPlaces");
                      localStorage.removeItem("cb_activityLog");
                      localStorage.removeItem("cb_quizHighScore");
                      window.location.reload();
                    }
                  }}
                >
                  Reset all progress
                </button>
              </div>
            </div>

            <div style={styles.note}>
              <strong>Teaching idea:</strong> Ask the child to pick one “tiny challenge” from the map and explain what they noticed.
            </div>
          </section>
        )}
      </main>

      <footer style={styles.footer}>
        <span>Made for ages 9–12 🌱</span>
        <span>•</span>
        <span>Be safe outside & ask a grown-up</span>
      </footer>
    </div>
  );
}


function MiniCard({ title, emoji, text, onClick }) {
  return (
    <button onClick={onClick} style={styles.miniCard}>
      <div style={styles.miniTop}>
        <span style={styles.emoji} aria-hidden="true">
          {emoji}
        </span>
        <span style={styles.miniTitle}>{title}</span>
      </div>
      <div style={styles.miniText}>{text}</div>
    </button>
  );
}

function MoodSlider({ value, onChange }) {
  return (
    <div style={styles.sliderWrap}>
      <input
        type="range"
        min="1"
        max="5"
        value={value}
        onChange={(e) => onChange(clamp(parseInt(e.target.value, 10), 1, 5))}
        style={styles.slider}
        aria-label="Mood slider"
      />
      <div style={styles.sliderLabels}>
        <span>😟 1</span>
        <span>🙂 {value}</span>
        <span>😁 5</span>
      </div>
    </div>
  );
}

function PlaceCard({ place }) {
  return (
    <div style={styles.placeCard}>
      <div style={styles.placeHead}>
        <div style={styles.placeEmoji} aria-hidden="true">
          {place.emoji}
        </div>
        <div>
          <div style={styles.placeTitle}>{place.title}</div>
          <div style={styles.placeSmall}><strong>What it is:</strong> {place.what}</div>
        </div>
      </div>

      <div style={styles.placeBlock}>
        <strong>How it can help your mind:</strong> {place.mental}
      </div>
      <div style={styles.placeBlock}>
        <strong>Tiny challenge:</strong> {place.tryIt}
      </div>
      <div style={styles.placeBlock}>
        <strong>Fun fact:</strong> {place.funFact}
      </div>
    </div>
  );
}

function DashStat({ label, value }) {
  return (
    <div style={styles.dashStat}>
      <div style={styles.dashValue}>{value}</div>
      <div style={styles.dashLabel}>{label}</div>
    </div>
  );
}


function resetBreathing(setBreathCount, setBreathPhase, setSecondsLeft, setBreathing) {
  setBreathCount(0);
  setBreathPhase("Ready");
  setSecondsLeft(0);
  setBreathing(false);
}

function computeStreak(activityLog) {
  if (!activityLog || activityLog.length === 0) return 0;
  const set = new Set(activityLog.map((a) => a.date));
  let streak = 0;

  const d = new Date();
  
  while (true) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const key = `${yyyy}-${mm}-${dd}`;

    if (!set.has(key)) break;
    streak += 1;

    d.setDate(d.getDate() - 1);
  }
  return streak;
}

function prettyActivity(type) {
  if (type === "breathing") return "Completed breathing";
  if (type === "mood-check") return "Saved mood check-in";
  if (type === "scavenger-hunt") return "Completed scavenger hunt";
  if (type === "quiz") return "Played the quiz";
  if (type === "quiz-highscore") return "New quiz high score";
  if (type?.startsWith("map:")) return `Unlocked map place: ${type.split(":")[1]}`;
  if (type?.startsWith("sound:")) return `Played sound: ${type.split(":")[1]}`;
  return type || "Activity";
}


const styles = {
  page: {
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
    background: "#f6fbf5",
    minHeight: "100vh",
    color: "#133",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    padding: "18px 16px 10px",
    borderBottom: "1px solid rgba(0,0,0,0.06)",
    background: "white",
  },
  titleRow: { display: "flex", gap: 12, alignItems: "center" },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 14,
    display: "grid",
    placeItems: "center",
    fontSize: 24,
    background: "#e9f7e5",
    border: "1px solid rgba(0,0,0,0.06)",
  },
  h1: { margin: 0, fontSize: 22, lineHeight: 1.1 },
  sub: { margin: "6px 0 0", fontSize: 13, opacity: 0.85 },
  nav: { marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8 },
  tabBtn: {
    border: "1px solid rgba(0,0,0,0.12)",
    background: "white",
    padding: "8px 10px",
    borderRadius: 999,
    fontSize: 13,
    cursor: "pointer",
  },
  tabBtnActive: { background: "#133", color: "white", borderColor: "#133" },
  main: { width: "min(980px, 100%)", margin: "0 auto", padding: "16px", flex: 1 },
  card: {
    background: "white",
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: 16,
    padding: 16,
    boxShadow: "0 8px 18px rgba(0,0,0,0.04)",
  },
  h2: { margin: "0 0 8px", fontSize: 18 },
  h3: { margin: "0 0 8px", fontSize: 15 },
  p: { margin: "0 0 10px", fontSize: 14, lineHeight: 1.5, opacity: 0.92 },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 12,
    marginTop: 12,
  },

  miniCard: {
    textAlign: "left",
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: 14,
    padding: 12,
    background: "#fbfffa",
    cursor: "pointer",
  },
  miniTop: { display: "flex", gap: 10, alignItems: "center" },
  emoji: { fontSize: 20 },
  miniTitle: { fontWeight: 800 },
  miniText: { marginTop: 8, fontSize: 13, opacity: 0.9, lineHeight: 1.4 },

  note: {
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    border: "1px solid rgba(0,0,0,0.08)",
    background: "#f2fbef",
    fontSize: 13,
    lineHeight: 1.4,
  },

  actions: { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 },
  primary: {
    border: "none",
    background: "#133",
    color: "white",
    padding: "10px 12px",
    borderRadius: 12,
    cursor: "pointer",
    fontWeight: 800,
    fontSize: 13,
  },
  secondary: {
    border: "1px solid rgba(0,0,0,0.12)",
    background: "white",
    padding: "10px 12px",
    borderRadius: 12,
    cursor: "pointer",
    fontWeight: 800,
    fontSize: 13,
  },

  // Mood
  row: { display: "flex", gap: 12, flexWrap: "wrap" },
  block: { flex: "1 1 280px" },
  label: { display: "block", fontSize: 13, fontWeight: 800, marginBottom: 6 },
  sliderWrap: {
    border: "1px solid rgba(0,0,0,0.08)",
    padding: 12,
    borderRadius: 14,
    background: "#fbfffa",
  },
  slider: { width: "100%" },
  sliderLabels: { display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 12 },

  result: {
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    border: "1px solid rgba(0,0,0,0.08)",
    background: "#f2fbef",
  },
  resultBig: { fontSize: 16, fontWeight: 900 },
  resultSmall: { marginTop: 4, fontSize: 12, opacity: 0.85 },

  // Breathing
  breatheBox: {
    marginTop: 10,
    borderRadius: 18,
    border: "1px solid rgba(0,0,0,0.08)",
    background: "#fbfffa",
    padding: 16,
    display: "grid",
    placeItems: "center",
    minHeight: 160,
    textAlign: "center",
  },
  breathePhase: { fontSize: 22, fontWeight: 900 },
  breatheTime: { marginTop: 8, fontSize: 18, opacity: 0.9 },
  breatheSmall: { marginTop: 8, fontSize: 12, opacity: 0.85 },

  // Sounds
  soundRow: { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 },

  // Map
  mapGrid: {
    marginTop: 10,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
    gap: 12,
  },
  mapTile: {
    border: "1px solid rgba(0,0,0,0.10)",
    background: "#fbfffa",
    borderRadius: 16,
    padding: 12,
    cursor: "pointer",
    textAlign: "left",
  },
  mapTileVisited: {
    background: "#f2fbef",
    borderColor: "rgba(0,0,0,0.18)",
  },
  mapEmoji: { fontSize: 26 },
  mapTitle: { marginTop: 8, fontWeight: 900 },
  mapHint: { marginTop: 4, fontSize: 12, opacity: 0.85 },

  placeCard: {
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: 16,
    padding: 12,
    background: "#fbfffa",
  },
  placeHead: { display: "flex", gap: 10, alignItems: "flex-start" },
  placeEmoji: { fontSize: 26, width: 34, textAlign: "center" },
  placeTitle: { fontWeight: 900, fontSize: 16 },
  placeSmall: { marginTop: 6, fontSize: 13, opacity: 0.92, lineHeight: 1.4 },
  placeBlock: {
    marginTop: 10,
    padding: 10,
    borderRadius: 12,
    background: "#f2fbef",
    border: "1px solid rgba(0,0,0,0.08)",
    fontSize: 13,
    lineHeight: 1.4,
  },

  // Hunt
  huntProgress: { marginTop: 10, display: "flex", gap: 10, alignItems: "center" },
  badge: {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: 999,
    border: "1px solid rgba(0,0,0,0.12)",
    background: "white",
    fontSize: 12,
    fontWeight: 800,
  },
  huntList: { marginTop: 10, display: "grid", gap: 8 },
  huntItem: {
    display: "flex",
    alignItems: "center",
    padding: 10,
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.08)",
    background: "#fbfffa",
    fontSize: 14,
  },

  // Quiz
  quizQ: { marginTop: 10, fontSize: 15 },
  quizOptions: { marginTop: 10, display: "grid", gap: 10 },
  optionBtn: {
    textAlign: "left",
    border: "1px solid rgba(0,0,0,0.12)",
    background: "white",
    padding: "10px 12px",
    borderRadius: 12,
    cursor: "pointer",
    fontWeight: 800,
    fontSize: 13,
  },
  optionBtnChosen: { outline: "3px solid rgba(19,51,51,0.15)" },
  optionBtnCorrect: { borderColor: "rgba(0,0,0,0.28)" },
  optionBtnWrong: { opacity: 0.75 },
  explain: {
    marginTop: 10,
    padding: 10,
    borderRadius: 12,
    background: "#f2fbef",
    border: "1px solid rgba(0,0,0,0.08)",
    fontSize: 13,
    lineHeight: 1.4,
  },

  // Dashboard
  dashGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: 12,
    marginTop: 10,
  },
  dashStat: {
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: 16,
    padding: 12,
    background: "#fbfffa",
  },
  dashValue: { fontSize: 20, fontWeight: 900 },
  dashLabel: { marginTop: 6, fontSize: 12, opacity: 0.85, lineHeight: 1.3 },

  panel: {
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: 16,
    padding: 12,
    background: "#fbfffa",
  },
  moodTable: { marginTop: 8, display: "grid", gap: 6, fontSize: 13 },
  moodRowHead: {
    display: "grid",
    gridTemplateColumns: "1fr 80px 80px",
    gap: 8,
    fontWeight: 900,
    opacity: 0.9,
  },
  moodRow: {
    display: "grid",
    gridTemplateColumns: "1fr 80px 80px",
    gap: 8,
    padding: "8px 10px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.08)",
    background: "white",
  },

  footer: {
    padding: 14,
    fontSize: 12,
    opacity: 0.8,
    display: "flex",
    gap: 8,
    justifyContent: "center",
  },
};