<script>

	import { onMount } from "svelte";
	import { get } from "svelte/store";
    import Modal from './Modal.svelte';

	let showModal = true;

    let blobURL = ""

    let fileNumber = 1
    let segmentNumber = null
    let transcription = ""

    let fileNumbers = []
    let segmentNumbers = []

    let loadingAudio = false
    let hidden = ""

    for (let i = 1; i <= 82; i++) {
        fileNumbers.push(i);
    }

    async function getSegments() {
        const resp = await fetch('api/audio', {
            method: 'POST',
            body: JSON.stringify({ 
                "request": "segmentNumbers",
                "fileNumber": fileNumber
            }),
        })

        segmentNumbers = await resp.json()
        segmentNumber = segmentNumbers[0]

        getAudio()
    }

    async function getAudio() {

        hidden = "hidden"
        loadingAudio = true

        const resp = await fetch('api/audio', {
            method: 'POST',
            body: JSON.stringify({ 
                "request": "getAudio",
                "fileNumber": fileNumber,
                "segmentNumber": segmentNumber
            }),
        })

        console.log(resp.body)

        let chunks = []

        const reader = resp.body.getReader();
            reader.read().then(function pump({ done, value }) {
            if (done) {

                const blob = new Blob(chunks, { type: "audio/wav" });
                blobURL = window.URL.createObjectURL(blob);

                const audio = document.querySelector("audio")
                audio.src = blobURL

                getTranscription()

                loadingAudio = false
                hidden = ""

                return;
            }
            chunks.push(value);
            return reader.read().then(pump);
        }); 
    }

    async function getTranscription() {
        const resp = await fetch('api/audio', {
            method: 'POST',
            body: JSON.stringify({ 
                "request": "getTranscription",
                "fileNumber": fileNumber,
                "segmentNumber": segmentNumber
            }),
        })

        transcription = await resp.json()
    }

    function stepForward() {
        if (segmentNumbers.indexOf(segmentNumber) < segmentNumbers.length - 1) {
            segmentNumber = segmentNumbers[segmentNumbers.indexOf(segmentNumber) + 1]
            getAudio()
        } else {
            if (fileNumbers.indexOf(fileNumber) < fileNumbers.length - 1) {
                fileNumber = fileNumbers[fileNumbers.indexOf(fileNumber) + 1]
                getSegments()
            }
        }
    }

    async function saveTranscription() {
        const resp = await fetch('api/audio', {
            method: 'POST',
            body: JSON.stringify({ 
                "request": "saveTranscription",
                "fileNumber": fileNumber,
                "segmentNumber": segmentNumber,
                "transcription": transcription
            }),
        })

        stepForward()
    }

    async function deleteAudio() {
        const resp = await fetch('api/audio', {
            method: 'POST',
            body: JSON.stringify({ 
                "request": "deleteAudio",
                "fileNumber": fileNumber,
                "segmentNumber": segmentNumber,
            }),
        })

        segmentNumbers = segmentNumbers.filter(item => item !== segmentNumber)

        stepForward()
    }

</script>

<div style="display: flex; justify-content: end; margin: 10px">
    <button type="button" class="btn btn-outline-dark" on:click={() => (showModal = true)}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-gear" viewBox="0 0 16 16" style="margin-bottom: 4px;">
            <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"></path>
            <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115l.094-.319z"></path>
        </svg>
    </button>
</div>


<Modal bind:showModal>
	<h2 slot="header">Information</h2>
    <div style="width: 400px;">
        <div style="display: flex; justify-content: center; margin-top:15px">
            <input type="number" min="1" max="100" class="form-control" placeholder="Age">
        </div>
    
        <div style="display: flex; justify-content: center; margin-top:15px">
            <input type="text" class="form-control" placeholder="Primary Language">
        </div>
    
        <div class="form-group" style="margin-top:15px">
            <label for="exampleFormControlSelect1">Technical Literacy</label>
            <select class="form-control" id="exampleFormControlSelect1">
              <option>1</option>
              <option>2</option>
              <option>3</option>
              <option>4</option>
              <option>5</option>
            </select>
          </div>
    </div>
    
</Modal>

<div style="width: 500px; margin: auto; margin-top: 10%;">

    <div style="display: flex; justify-content: center; column-gap: 10px; margin-top: 20px">
        <p style="font-size: 30px;">Round: 0</p>
    </div>

    <hr>
    
    <div style="display: flex; justify-content: center; align-items:center; margin-top: 20px">
        {#if loadingAudio}
        <div class="spinner-border text-dark" style="align-self:flex-start; margin-right: 20px" role="status"></div>
        {/if}
        <audio controls autoplay/>
    </div>
    
    <div style="display: flex; justify-content: center; column-gap: 10px; margin-top: 20px">
        <button type="button" class="btn btn-outline-danger" style="">Fake</button>
        <button type="button" class="btn btn-outline-dark">Not Sure</button>
        <button type="button" class="btn btn-outline-success">Real</button>
    </div>

    <hr>

    <div style="display: flex; justify-content: center; column-gap: 10px; margin-top: 20px">
        <p style="font-style: italic;">Corrent: 0</p>
        <p style="font-style: italic;">Incorrect: 0</p>
        <p style="font-style: italic;">Accuracy: 0%</p>
    </div>
    
</div>


<div style="display: flex; justify-content: center; column-gap: 10px; margin-top: 20px">
    <a href="https://forms.gle/iftvHK1c8WDYJCv47">Post Game Questionnaire</a>
</div>

