const PLAY_VIDEO = 'Play';
const PAUSE_VIDEO = 'Pause';
const BUTTON_TYPE = 'button';
const FORM_ID = 'lecture__current-question-form';
const FORM_PROMPT_ID = 'lecture__current-question-prompt';
const FORM_OPTION_ID = 'lecture__current-question-option';
const RESPONSE_PROMPT = 'lecture__current-question-response';
const REPLAY_BUTTON_TEXT = 'Replay Video Segment';
const CONTINUE_BUTTON_TEXT = 'Display Answer and Continue';

const video = document.getElementById('lecture__video');
const volumeControl = document.getElementById('lecture__video-volume-control');
const playButton = document.getElementById('lecture__video-button');
const currentQuestion = document.getElementById('lecture__current-question')

video.src = metaData.videoURL;

// Configure play button
const pauseVideo = () => {
    video.pause();
    playButton.innerHTML = PLAY_VIDEO;
};

const playVideo = () => {
    video.play();
    playButton.innerHTML = PAUSE_VIDEO;
};


playButton.addEventListener("click", function() {
    if (video.paused) {
        playVideo();
    } else {
        pauseVideo();
    }
});

function createNewPrompt(promptText, promptClass) {
    currentQuestion.innerHTML = '';
    const prompt = document.createElement('span');
    prompt.classList.add(promptClass);
    prompt.innerText = promptText;
    currentQuestion.appendChild(prompt);
}

// Handle questions
let currentQuestionIndex = 0;

function replaySegmentAndAskQuestion() {
    currentQuestion.innerHTML = '';
    let previousSegmentTime = 0;
    if (currentQuestionIndex > 0) {
        previousSegmentTime = metaData.questions[currentQuestionIndex - 1].timeToDisplayInSeconds;
    }
    video.currentTime = previousSegmentTime;
    createEventListenerForCurrentQuestion();
    playButton.disabled = false;    
    playVideo();
}

function continueToNextSegment() {
    // Increment the question index.
    currentQuestionIndex = currentQuestionIndex + 1;
    // Respond to the next question.
    createEventListenerForCurrentQuestion();
    // Continue the video.
    playButton.disabled = false;
    playVideo();
}

function continueToNextSegmentAndDisplayAnswer() {
    const question = metaData.questions[currentQuestionIndex];
    const correctAnswer = question.options[question.correctAnswerIndex];
    createNewPrompt(`The correct answer was: ${correctAnswer}`, 'answer-prompt');
    continueToNextSegment();
}

function handleCorrectAnswer() {
    // Mark as correct if not already marked incorrectly
    if (metaData.questions[currentQuestionIndex].didAnswerCorrectly !== undefined) {
        metaData.questions[currentQuestionIndex].didAnswerCorrectly = true;
    }
    // Display the correct answer prompt.
    createNewPrompt('Congratulations! You got the question correct.', `${RESPONSE_PROMPT}--correct`);
    continueToNextSegment();
}

function handleIncorrectAnswer() {
    // Mark as incorrect
    metaData.questions[currentQuestionIndex].didAnswerCorrectly = false;
    // Display the incorrect answer prompt.
    createNewPrompt('You got the question incorrect. Please select an option below.', `${RESPONSE_PROMPT}--incorrect`)
    // Display option to replay video and re-ask question.
    const replaySegmentButton = document.createElement('input');
    replaySegmentButton.type = BUTTON_TYPE;
    replaySegmentButton.value = REPLAY_BUTTON_TEXT;
    replaySegmentButton.id = 'lecture__replay-button';
    // Display option to show the correct answer and continue the video.
    const continueButton = document.createElement('input');
    continueButton.type = BUTTON_TYPE;
    continueButton.value = CONTINUE_BUTTON_TEXT;
    continueButton.id = 'lecture__continue-button';
    currentQuestion.appendChild(replaySegmentButton);
    currentQuestion.appendChild(continueButton);
    replaySegmentButton.onclick = replaySegmentAndAskQuestion;
    continueButton.onclick = continueToNextSegmentAndDisplayAnswer;
}

function handleSubmission() {
  const selection = document.querySelector(`input:checked`);
  console.log(selection);
    if (selection) {
        const selectedAnswerIndex = parseInt(selection.value);
        // Mark the question form as being answered. TODO: maybe remove
        const currentQuestionForm = document.getElementById(FORM_ID);
        currentQuestionForm.classList.add(`${FORM_ID}--answered`);
        // Determine if the current question was answered correctly.
        const correctAnswerIndex = metaData.questions[currentQuestionIndex].correctAnswerIndex;
        if (selectedAnswerIndex === correctAnswerIndex) {
            handleCorrectAnswer();
        } else {
            handleIncorrectAnswer();
        }
    }
}

function buildNewQuestionForm() {
    const newQuestionForm = document.createElement('form');
    newQuestionForm.id = FORM_ID;
    metaData.questions[currentQuestionIndex].options.forEach((option, index) => {
        const div = document.createElement('div');
        div.classList.add(FORM_OPTION_ID)
        const optionInput = document.createElement('input');
        optionInput.innerText = option;
        optionInput.type = 'radio';
        optionInput.name = 'option';
        optionInput.value = index;
        div.appendChild(optionInput);
        newQuestionForm.appendChild(div);
        optionInput.insertAdjacentText('afterEnd', option);
    });
    const submitButton = document.createElement('input');
    submitButton.type = BUTTON_TYPE;
    submitButton.value = 'Submit';
    submitButton.id = 'lecture__current-question-submit-button';
    newQuestionForm.appendChild(submitButton);
    currentQuestion.appendChild(newQuestionForm);
    submitButton.onclick = handleSubmission;
}

function handleCurrentQuestion() {
    pauseVideo();
    playButton.disabled = true;
    createNewPrompt(metaData.questions[currentQuestionIndex].questionPrompt, FORM_PROMPT_ID);
    buildNewQuestionForm();    
}

function createEventListenerForCurrentQuestion() {
    const eventFunction = function() {
        if (this.currentTime >= metaData.questions[currentQuestionIndex].timeToDisplayInSeconds) {
            this.removeEventListener('timeupdate', eventFunction);
            handleCurrentQuestion();
        }
    };

    // Only set the new event listener if there exists a next question.
    if (metaData.questions[currentQuestionIndex]) {
            video.addEventListener('timeupdate', eventFunction);
    }
}

video.onended = function() {
    // Display Final score.
    const correctCount = metaData.questions.filter(q => !q.didAnswerCorrectly).length;
    const totalCount = metaData.questions.length;
    createNewPrompt(`Lecture complete. Answered ${correctCount} out of ${totalCount} correctly.`);
}

createEventListenerForCurrentQuestion();