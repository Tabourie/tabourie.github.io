/*
    CALM ARCHWAY
    GUIDED BREATHING PROTOTYPE
*/


/*
    HTML ELEMENTS
*/

const breathingCircle =
    document.getElementById(
        "breathingCircle"
    );


const phaseText =
    document.getElementById(
        "phaseText"
    );


const phaseHint =
    document.getElementById(
        "phaseHint"
    );


const instructionText =
    document.getElementById(
        "instructionText"
    );


const startButton =
    document.getElementById(
        "startButton"
    );


const pauseButton =
    document.getElementById(
        "pauseButton"
    );


const resetButton =
    document.getElementById(
        "resetButton"
    );


const restartButton =
    document.getElementById(
        "restartButton"
    );


const minimalModeButton =
    document.getElementById(
        "minimalModeButton"
    );


const sessionLengthSelect =
    document.getElementById(
        "sessionLength"
    );


const breathingPatternSelect =
    document.getElementById(
        "breathingPattern"
    );


const sessionInfo =
    document.getElementById(
        "sessionInfo"
    );


const sessionTimeDisplay =
    document.getElementById(
        "sessionTime"
    );


const phaseTimeDisplay =
    document.getElementById(
        "phaseTime"
    );


const sessionControlsArea =
    document.getElementById(
        "sessionControlsArea"
    );


const completionPanel =
    document.getElementById(
        "completionPanel"
    );


const completedDuration =
    document.getElementById(
        "completedDuration"
    );


const completedPattern =
    document.getElementById(
        "completedPattern"
    );


const settingsHelpButton =
    document.getElementById(
        "settingsHelpButton"
    );


const settingsHelpPanel =
    document.getElementById(
        "settingsHelpPanel"
    );



/*
    BREATHING PATTERNS
*/

const breathingPatterns = {


    /*
        RELAXED
        4 - 2 - 4 - 2
    */

    relaxed: [

        {
            name: "Inhale",

            duration: 4000,

            instruction:
                "Breathe in slowly...",

            hint:
                "Let the circle gently expand"
        },


        {
            name: "Hold",

            duration: 2000,

            instruction:
                "Hold gently...",

            hint:
                "Stay relaxed"
        },


        {
            name: "Exhale",

            duration: 4000,

            instruction:
                "Breathe out slowly...",

            hint:
                "Let the circle guide you down"
        },


        {
            name: "Hold",

            duration: 2000,

            instruction:
                "Pause briefly...",

            hint:
                "Take a quiet moment"
        }

    ],



    /*
        BOX
        4 - 4 - 4 - 4
    */

    box: [

        {
            name: "Inhale",

            duration: 4000,

            instruction:
                "Breathe in slowly...",

            hint:
                "Inhale for four seconds"
        },


        {
            name: "Hold",

            duration: 4000,

            instruction:
                "Hold gently...",

            hint:
                "Hold for four seconds"
        },


        {
            name: "Exhale",

            duration: 4000,

            instruction:
                "Breathe out slowly...",

            hint:
                "Exhale for four seconds"
        },


        {
            name: "Hold",

            duration: 4000,

            instruction:
                "Pause gently...",

            hint:
                "Hold for four seconds"
        }

    ],



    /*
        SLOW
        5 - 2 - 5 - 2
    */

    slow: [

        {
            name: "Inhale",

            duration: 5000,

            instruction:
                "Take a slow breath in...",

            hint:
                "Let the circle slowly expand"
        },


        {
            name: "Hold",

            duration: 2000,

            instruction:
                "Hold gently...",

            hint:
                "Stay relaxed"
        },


        {
            name: "Exhale",

            duration: 5000,

            instruction:
                "Slowly breathe out...",

            hint:
                "Let the circle slowly settle"
        },


        {
            name: "Hold",

            duration: 2000,

            instruction:
                "Pause briefly...",

            hint:
                "Take a quiet moment"
        }

    ]

};



/*
    DISPLAY NAMES
*/

const patternNames = {

    relaxed:
        "Relaxed 4-2-4-2",

    box:
        "Box 4-4-4-4",

    slow:
        "Slow 5-2-5-2"

};



/*
    APPLICATION STATE
*/

let phases =
    breathingPatterns.relaxed;


let currentPhaseIndex =
    0;


let isRunning =
    false;


let isPaused =
    false;


let sessionComplete =
    false;


let minimalMode =
    false;


let phaseElapsed =
    0;


let sessionElapsed =
    0;


let lastTimestamp =
    null;


let animationFrameId =
    null;


let sessionDuration =
    Number(
        sessionLengthSelect.value
    )
    *
    1000;



/*
    FORMAT TIME
*/

function formatTime(
    milliseconds
) {


    const totalSeconds =
        Math.max(

            0,

            Math.ceil(
                milliseconds / 1000
            )

        );


    const minutes =
        Math.floor(
            totalSeconds / 60
        );


    const seconds =
        totalSeconds % 60;


    return (

        String(minutes)
            .padStart(
                2,
                "0"
            )

        +

        ":"

        +

        String(seconds)
            .padStart(
                2,
                "0"
            )

    );

}



/*
    FORMAT SESSION LENGTH
*/

function formatSessionLength(
    seconds
) {


    const minutes =
        seconds / 60;


    if (
        minutes === 1
    ) {

        return "1 minute";
    }


    return `${minutes} minutes`;

}



/*
    SESSION TIMER DISPLAY
*/

function updateSessionDisplay() {


    const remaining =
        sessionDuration
        -
        sessionElapsed;


    sessionTimeDisplay.textContent =
        formatTime(
            remaining
        );

}



/*
    BREATHING PATTERN
*/

function updateBreathingPattern() {


    phases =
        breathingPatterns[
        breathingPatternSelect.value
        ];


    resetBreathing();

}



/*
    TIMER VISIBILITY
*/

function updateTimerVisibility() {


    const shouldHide =
        minimalMode
        ||
        sessionComplete;


    sessionInfo
        .classList
        .toggle(

            "hidden",

            shouldHide

        );

}



/*
    SETTINGS HELP
*/

function toggleSettingsHelp() {


    const isHidden =
        settingsHelpPanel
            .classList
            .contains(
                "hidden"
            );


    settingsHelpPanel
        .classList
        .toggle(
            "hidden"
        );


    settingsHelpButton
        .setAttribute(

            "aria-expanded",

            String(isHidden)

        );


    if (isHidden) {


        settingsHelpButton.textContent =
            "Hide settings information";

    }


    else {


        settingsHelpButton.textContent =
            "What do these settings mean?";

    }

}



/*
    MINIMAL MODE
*/

function toggleMinimalMode() {


    minimalMode =
        !minimalMode;


    document.body
        .classList
        .toggle(

            "minimal-mode",

            minimalMode

        );


    breathingCircle
        .classList
        .toggle(

            "reduced-motion",

            minimalMode

        );


    document.body
        .classList
        .toggle(

            "reduce-background-motion",

            minimalMode

        );


    minimalModeButton
        .classList
        .toggle(

            "active",

            minimalMode

        );


    minimalModeButton
        .setAttribute(

            "aria-pressed",

            String(minimalMode)

        );


    if (minimalMode) {


        minimalModeButton.textContent =
            "Minimal Mode: On";


        settingsHelpPanel
            .classList
            .add(
                "hidden"
            );


        settingsHelpButton.textContent =
            "What do these settings mean?";


        settingsHelpButton
            .setAttribute(

                "aria-expanded",

                "false"

            );

    }


    else {


        minimalModeButton.textContent =
            "Minimal Mode: Off";

    }


    updateTimerVisibility();

}



/*
    CIRCLE INTERACTION STATE
*/

function updateCircleInteraction() {


    if (

        !isRunning

        &&

        !isPaused

        &&

        !sessionComplete

    ) {


        breathingCircle
            .classList
            .add(
                "ready"
            );


        breathingCircle
            .setAttribute(

                "aria-label",

                "Start breathing session"

            );


        return;
    }



    if (isPaused) {


        breathingCircle
            .classList
            .add(
                "ready"
            );


        breathingCircle
            .setAttribute(

                "aria-label",

                "Resume breathing session"

            );


        return;
    }



    if (sessionComplete) {


        breathingCircle
            .classList
            .remove(
                "ready"
            );


        breathingCircle
            .setAttribute(

                "aria-label",

                "Breathing session complete"

            );


        return;
    }



    breathingCircle
        .classList
        .remove(
            "ready"
        );


    breathingCircle
        .setAttribute(

            "aria-label",

            "Breathing session currently running"

        );

}



/*
    UPDATE VISUAL STATE
*/

function updateVisualState() {


    const currentPhase =
        phases[
        currentPhaseIndex
        ];


    breathingCircle
        .classList
        .remove(

            "ready",

            "inhale",

            "exhale"

        );


    breathingCircle
        .style
        .setProperty(

            "--phase-duration",

            `${currentPhase.duration}ms`

        );



    if (
        currentPhase.name
        ===
        "Inhale"
    ) {


        breathingCircle
            .classList
            .add(
                "inhale"
            );

    }



    if (
        currentPhase.name
        ===
        "Exhale"
    ) {


        breathingCircle
            .classList
            .add(
                "exhale"
            );

    }



    phaseText.textContent =
        currentPhase.name;


    phaseHint.textContent =
        currentPhase.hint;


    instructionText.textContent =
        currentPhase.instruction;


    updateCircleInteraction();

}



/*
    PHASE TIMER
*/

function updatePhaseTimer() {


    const currentPhase =
        phases[
        currentPhaseIndex
        ];


    const remaining =
        currentPhase.duration
        -
        phaseElapsed;


    phaseTimeDisplay.textContent =
        `${Math.max(

            0,

            remaining / 1000

        ).toFixed(1)}s`;

}



/*
    MAIN ANIMATION LOOP
*/

function animationLoop(
    timestamp
) {


    if (!isRunning) {

        return;
    }



    if (
        lastTimestamp === null
    ) {


        lastTimestamp =
            timestamp;

    }



    const delta =
        timestamp
        -
        lastTimestamp;


    lastTimestamp =
        timestamp;



    phaseElapsed +=
        delta;


    sessionElapsed +=
        delta;



    /*
        SESSION COMPLETE
    */

    if (

        sessionElapsed
        >=
        sessionDuration

    ) {


        completeSession();

        return;
    }



    let currentPhase =
        phases[
        currentPhaseIndex
        ];



    /*
        MOVE TO NEXT BREATHING PHASE
    */

    while (

        phaseElapsed
        >=
        currentPhase.duration

    ) {


        phaseElapsed -=
            currentPhase.duration;


        currentPhaseIndex =
            (
                currentPhaseIndex
                +
                1
            )
            %
            phases.length;


        currentPhase =
            phases[
            currentPhaseIndex
            ];


        updateVisualState();

    }



    /*
        UPDATE TIMERS
    */

    updatePhaseTimer();


    updateSessionDisplay();



    /*
        NEXT FRAME
    */

    animationFrameId =
        requestAnimationFrame(
            animationLoop
        );

}



/*
    START / RESUME
*/

function startBreathing() {


    if (isRunning) {

        return;
    }


    if (sessionComplete) {

        return;
    }


    sessionDuration =
        Number(
            sessionLengthSelect.value
        )
        *
        1000;


    isRunning =
        true;


    isPaused =
        false;


    lastTimestamp =
        null;



    startButton.textContent =
        "Running";


    startButton.disabled =
        true;


    pauseButton.disabled =
        false;



    /*
        LOCK SESSION SETTINGS
    */

    sessionLengthSelect.disabled =
        true;


    breathingPatternSelect.disabled =
        true;



    updateVisualState();



    animationFrameId =
        requestAnimationFrame(
            animationLoop
        );

}



/*
    CENTRAL CIRCLE CLICK
*/

function handleCircleClick() {


    if (

        !isRunning

        &&

        !isPaused

        &&

        !sessionComplete

    ) {


        startBreathing();

        return;
    }



    if (isPaused) {


        startBreathing();

    }

}



/*
    PAUSE
*/

function pauseBreathing() {


    if (!isRunning) {

        return;
    }


    isRunning =
        false;


    isPaused =
        true;


    cancelAnimationFrame(
        animationFrameId
    );


    lastTimestamp =
        null;



    startButton.textContent =
        "Resume";


    startButton.disabled =
        false;


    pauseButton.disabled =
        true;



    instructionText.textContent =
        "Session paused.";


    phaseText.textContent =
        "Paused";


    phaseHint.textContent =
        "Click here or press Resume";


    updateCircleInteraction();

}



/*
    RESET
*/

function resetBreathing() {


    isRunning =
        false;


    isPaused =
        false;


    sessionComplete =
        false;



    cancelAnimationFrame(
        animationFrameId
    );



    currentPhaseIndex =
        0;


    phaseElapsed =
        0;


    sessionElapsed =
        0;


    lastTimestamp =
        null;



    sessionDuration =
        Number(
            sessionLengthSelect.value
        )
        *
        1000;



    /*
        RESTORE SESSION UI
    */

    sessionControlsArea
        .classList
        .remove(
            "hidden"
        );


    completionPanel
        .classList
        .add(
            "hidden"
        );



    /*
        RESET CIRCLE
    */

    breathingCircle
        .classList
        .remove(

            "inhale",

            "exhale"

        );


    breathingCircle
        .classList
        .add(
            "ready"
        );


    breathingCircle
        .style
        .setProperty(

            "--phase-duration",

            "4s"

        );



    /*
        RESET TEXT
    */

    phaseText.textContent =
        "Ready";


    phaseHint.textContent =
        "Click here or press Start";


    instructionText.textContent =
        "Press Start or click the circle when you're ready.";



    /*
        RESET TIMER
    */

    phaseTimeDisplay.textContent =
        "0.0s";



    /*
        RESET BUTTONS
    */

    startButton.textContent =
        "Start";


    startButton.disabled =
        false;


    pauseButton.disabled =
        true;



    /*
        UNLOCK SETTINGS
    */

    sessionLengthSelect.disabled =
        false;


    breathingPatternSelect.disabled =
        false;



    updateSessionDisplay();


    updateCircleInteraction();


    updateTimerVisibility();

}



/*
    COMPLETE SESSION
*/

function completeSession() {


    isRunning =
        false;


    isPaused =
        false;


    sessionComplete =
        true;


    cancelAnimationFrame(
        animationFrameId
    );



    sessionElapsed =
        sessionDuration;


    updateSessionDisplay();



    /*
        FINAL CIRCLE STATE
    */

    breathingCircle
        .classList
        .remove(

            "inhale",

            "exhale",

            "ready"

        );


    breathingCircle
        .style
        .setProperty(

            "--phase-duration",

            "0.5s"

        );



    phaseText.textContent =
        "Complete";


    phaseHint.textContent =
        "Take your time";



    /*
        COMPLETION DETAILS
    */

    completedDuration.textContent =
        formatSessionLength(

            Number(
                sessionLengthSelect.value
            )

        );


    completedPattern.textContent =
        patternNames[
        breathingPatternSelect.value
        ];



    /*
        SWITCH TO COMPLETION VIEW
    */

    sessionControlsArea
        .classList
        .add(
            "hidden"
        );


    sessionInfo
        .classList
        .add(
            "hidden"
        );


    completionPanel
        .classList
        .remove(
            "hidden"
        );



    /*
        UNLOCK SETTINGS
    */

    sessionLengthSelect.disabled =
        false;


    breathingPatternSelect.disabled =
        false;



    updateCircleInteraction();


    restartButton.focus();

}



/*
    START ANOTHER SESSION
*/

function startAnotherSession() {


    resetBreathing();


    startButton.focus();

}



/*
    EVENT LISTENERS
*/

sessionLengthSelect
    .addEventListener(

        "change",

        resetBreathing

    );


breathingPatternSelect
    .addEventListener(

        "change",

        updateBreathingPattern

    );


minimalModeButton
    .addEventListener(

        "click",

        toggleMinimalMode

    );


settingsHelpButton
    .addEventListener(

        "click",

        toggleSettingsHelp

    );


startButton
    .addEventListener(

        "click",

        startBreathing

    );


pauseButton
    .addEventListener(

        "click",

        pauseBreathing

    );


resetButton
    .addEventListener(

        "click",

        resetBreathing

    );


restartButton
    .addEventListener(

        "click",

        startAnotherSession

    );


breathingCircle
    .addEventListener(

        "click",

        handleCircleClick

    );



/*
    INITIAL STATE
*/

updateTimerVisibility();


resetBreathing();