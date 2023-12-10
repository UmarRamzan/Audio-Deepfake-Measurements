<script>

	import { onMount } from "svelte";
	import { get } from "svelte/store";
    import { scale, fade} from "svelte/transition";
    import { quintOut } from "svelte/easing";

	let showModal = true;

    let dialog;

	$: if (dialog && showModal) dialog.showModal();

    let age;
    let language;

    let userId;

    let audioData;
    let audioId;

    let result = ""
    let correct = 0;
    let incorrect = 0;
    let accuracy = 0;

    let startTime;
    let endTime;

    let error = false
    let errorText = ""

    let blobURL = ""
    let audioBlobs = []

    let loadingAudio = false;
    let savingChoice = false;

    let numbers = Array.from({ length: 30 }, (_, index) => index);

    let roundNum = 1;
    let displayRoundNum = 1;

    let creatingUser = false;

    function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    }

    shuffleArray(numbers);

    async function createUser() {

        creatingUser = true

        if (age == "" || age == null) {
            errorText = 'Please enter a value for age'
        } else if (!isNumber(age)) {
            errorText = 'Please enter a numerical value for age'
        } else if (age <= 0 || age > 100) {
            errorText = 'Please enter a valid age'
        } else if (language == "" || language == null) {
            errorText = 'Please enter a value for language'
        } else {
            errorText = ''
        }

        if (errorText != "") {
            creatingUser = false
            return
        }

        const resp = await fetch('api/audio', {
            method: 'POST',
            body: JSON.stringify({ 
                "request": "createUser",
                "age": age,
                "language": language,
            }),
        })

        let respData = await resp.json()
        userId = respData['data'][0]['user_id']

		dialog.close()
        creatingUser = false
        reset()
    }

    function reset() {
        roundNum = 1
        displayRoundNum = 1
        correct = 0
        incorrect = 0
        accuracy = 0
        result = ""
        playAudio(0)
    }

    async function getAudioData() {
        const resp = await fetch('api/audio', {
            method: 'POST',
            body: JSON.stringify({ 
                "request": "getAudioData",
            }),
        })

        let respData = await resp.json()

        return respData
    }

    async function getAudio(path) {

        const resp = await fetch('api/audio', {
            method: 'POST',
            body: JSON.stringify({ 
                "request": "getAudio",
                "path": path,
            }),
        })

        let chunks = []

        const reader = resp.body.getReader();
        await new Promise( (resolve, reject) => {
            function pump({ done, value }) {
                if (done) {
                    const blob = new Blob(chunks, { type: "audio/wav" });
                    audioBlobs.push(blob)
                    resolve(blob);
                    return;
                }
                chunks.push(value);
                reader.read().then(pump);
            }
            reader.read().then(pump);
        });
    }

    async function playAudio(i) {

        while (audioBlobs.length <= i) {
            await new Promise(r => setTimeout(r, 1000));
        }

        loadingAudio = false
        await new Promise(r => setTimeout(r, 500))

        blobURL = window.URL.createObjectURL(audioBlobs[i]);
        const audio = document.querySelector("audio")
        audio.src = blobURL

        startTime = performance.now()
    }

    async function saveChoice(choice) {

        if (savingChoice) { return }
        if (loadingAudio) { return }
        if (roundNum > 30) { return }

        savingChoice = true

        endTime = performance.now()
        let time = endTime - startTime

        let real = audioData[numbers[roundNum - 1]]['real']

        result = ""

        if (choice == 'real' && real == true) {
            result = "correct"
        } else if (choice == 'fake' && real == false) {
            result = "correct"
        } else if (choice == 'unsure') {
            result = "unsure"
        } else {
            result = "incorrect"
        }

        if (result == "correct") {
            correct += 1
        } else if (result == "incorrect") {
            incorrect += 1
        }

        if (correct + incorrect == 0) {
            accuracy = 0
        } else {
            accuracy = Math.round((correct / (correct + incorrect)) * 100)
        }

        fetch('api/audio', {
            method: 'POST',
            body: JSON.stringify({ 
                "request": "saveChoice",
                "user_id": userId,
                "audio_id": audioId,
                "round_num": roundNum,
                "choice": choice,
                "result": result,
                "time": time,
            }),
        })

        await stepForward()
    }

    async function stepForward() {

        roundNum += 1

        if (roundNum > 30) {
            savingChoice = false
            return
        }

        loadingAudio = true

        audioId = audioData[numbers[roundNum - 1]]['audio_id']

        await playAudio(roundNum - 1)

        displayRoundNum += 1
        
        loadingAudio = false
        savingChoice = false
    }

    function isNumber(value) {
        return typeof value === 'number' && !isNaN(value);
    }

    onMount(async () => {
        audioData = await getAudioData()

        audioId = audioData[numbers[0]]['audio_id']

        for (let i in numbers) {
            await getAudio(audioData[numbers[i]]['path'])
        }
    })

</script>

<!-- <div style="display: flex; justify-content: end; margin: 10px">
    <button type="button" class="btn btn-outline-dark" on:click={() => (showModal = true)}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-gear" viewBox="0 0 16 16" style="margin-bottom: 4px;">
            <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"></path>
            <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115l.094-.319z"></path>
        </svg>
    </button>
</div> -->

<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions -->
<dialog
	bind:this={dialog}
	on:close={() => (showModal = false)}
>
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div on:click|stopPropagation>
		<h2>Information</h2>
		<hr />
		<div style="max-width: 400px;">
            <div style="display: flex; justify-content: center; margin-top:15px">
                <input type="number" min="1" max="100" class="form-control" placeholder="Age" bind:value={age} required>
            </div>
        
            <div style="display: flex; justify-content: center; margin-top:15px">
                <input type="text" class="form-control" placeholder="Native Language" bind:value={language} required>
            </div>
            
            {#if errorText != ""}
                <div style="margin-top: 15px;" class="alert alert-danger" role="alert">
                    {errorText}
                </div>
            {/if}

        </div>

		<hr />
        <p style="font-style:oblique; text-align:center">As part of a user study on human perceptions of audio deepfakes, you will be presented with a collection of real and machine generated (deepfake) audio clips and must classify them accordingly.</p>
		<!-- svelte-ignore a11y-autofocus -->
        {#if !creatingUser}
            <div style="display: flex; justify-content: end;">
                <button type="button" class="btn btn-outline-primary" on:click={() => createUser()}>Proceed</button>
            </div>
        {:else}
            <div style="display: flex; justify-content: end;">
                <button type="button" class="btn btn-primary disabled" on:click={() => createUser()}>Proceed</button>
            </div>
        {/if}
        
	</div>
</dialog>

<div style="max-width: 500px; margin:auto; margin-top: 10%; padding: 0px 30px">

    <div style="display: flex; justify-content: center; column-gap: 10px; margin-top: 20px">
        <p style="font-size: 30px;">Round: {displayRoundNum}</p>
    </div>

    {#if roundNum >= 31}
    <div class="progress" role="progressbar" aria-label="Basic example" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
        <div class="progress-bar" style="width: 100%"></div>
    </div>
    {:else}
    <div class="progress" role="progressbar" aria-label="Basic example" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
        <div class="progress-bar bg-info" style="width: {Math.floor(((roundNum-1)/30)*100)}%"></div>
    </div>
    {/if}
      

    <hr>
    
    <div style="display: flex; justify-content: center; align-items:center; margin-top: 20px;">
        {#if loadingAudio}
            <div class="spinner-border text-dark" role="status">
            </div>
        {:else}
        <audio disabled controls autoplay style="margin: 0px;"/>
        {/if}
        
    </div>
    
    <div style="display: flex; justify-content: center; column-gap: 10px; margin-top: 20px">
        <button type="button" class="btn btn-outline-danger" style="" on:click={()=>{saveChoice('fake')}}>Fake</button>
        <button type="button" class="btn btn-outline-dark" on:click={()=>{saveChoice('unsure')}}>Not Sure</button>
        <button type="button" class="btn btn-outline-success" on:click={()=>{saveChoice('real')}}>Real</button>
    </div>

    <hr>
    {#if correct + incorrect == 0}
        <div class="progress">
            <div class="progress-bar bg-success" role="progressbar" style="width: 0%" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100"></div>
        </div>
    {:else}
        <div class="progress">
            <div class="progress-bar bg-success" role="progressbar" style="width: {accuracy}%" aria-valuenow="30" aria-valuemin="0" aria-valuemax="100"></div>
            <div class="progress-bar bg-danger" role="progressbar" style="width: {100-accuracy}%" aria-valuenow="20" aria-valuemin="0" aria-valuemax="100"></div>
        </div>
    {/if}
    

    <div style="display: flex; justify-content: center; column-gap: 10px; margin-top: 20px">
        {#if result == "correct"}
            <p style="font-style: italic; color: green;"><b>Correct: {correct}</b></p>
            <p style="font-style: italic;">Accuracy: {accuracy}%</p>
            <p style="font-style: italic;">Incorrect: {incorrect}</p>
        {:else if result == "incorrect"}
            <p style="font-style: italic;">Correct: {correct}</p>
            <p style="font-style: italic;">Accuracy: {accuracy}%</p>
            <p style="font-style: italic; color: red;"><b>Incorrect: {incorrect}</b></p>
        {:else}
            <p style="font-style: italic;">Correct: {correct}</p>
            <p style="font-style: italic;">Accuracy: {accuracy}%</p>
            <p style="font-style: italic;">Incorrect: {incorrect}</p>
        {/if}
    
    </div>

    <div style="display: flex; justify-content: center; column-gap: 10px; margin-top: 20px">
        <a href="https://forms.gle/MymZXrFTV5rfQmXy8">Post Game Questionnaire</a>
    </div>
    
</div>


<style>
    
    dialog {
    width: 400px;
    border-radius: 0.4em;
	}
	dialog::backdrop {
		background: rgba(0, 0, 0, 0.3);
	}
	dialog > div {
		padding: 1em;
	}
	dialog[open] {
		animation: zoom 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	@keyframes zoom {
		from {
			transform: scale(0.95);
		}
		to {
			transform: scale(1);
		}
	}
	dialog[open]::backdrop {
		animation: fade 0.2s ease-out;
	}
	@keyframes fade {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	button {
		display: block;
	}

</style>
