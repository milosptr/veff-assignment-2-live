
const API_TUNES_URL = '/api/v1/tunes'

const main = () => {
  const synth = new Tone.Synth().toDestination()
  // HTML elements
  const pianoKeys = document.querySelectorAll('#keyboardDiv button')
  const playButton = document.getElementById('tunebtn')
  const tunesDrop = document.getElementById('tunesDrop')
  const recordBtn = document.getElementById('recordbtn')
  const stopBtn = document.getElementById('stopbtn')
  const recordNameInput = document.getElementById('recordName')

  // State
  let isRecording = false
  let isKeyDown = false
  let recordName = 'No-name Tune'
  const keys = {
    'KeyA': 'C4',
    'KeyW': 'C#4',
    'KeyS': 'D4',
    'KeyE': 'D#4',
    'KeyD': 'E4',
    'KeyF': 'F4',
    'KeyT': 'F#4',
    'KeyG': 'G4',
    'KeyY': 'G#4',
    'KeyH': 'A4',
    'KeyU': 'Bb4',
    'KeyJ': 'B4',
    'KeyK': 'C5',
    'KeyO': 'C#5',
    'KeyL': 'D5',
    'KeyP': 'D#5',
    'Semicolon': 'E5',
  }
  let recordedTunes = []
  let availableTunes = []
  let clock = 0
  let clockInterval = undefined

  // Handlers
  const applyNoteBackground = (note, timing = 0) => {
    setTimeout(() => {
      const keyElement = document.getElementById(note.toLowerCase())
      if(!keyElement) return
      keyElement.style.backgroundColor = '#989898'
      setTimeout(() => {
        keyElement.style = ''
      }, 200)
    }, timing * 1000)
  }
  const handlePlayTune = (note, timing = 0) => {
    const now = Tone.now()
    applyNoteBackground(note, timing)
    synth.triggerAttackRelease(note, "8n", now + parseFloat(timing))
  }
  const playSelectedTune = () => {
    const tune = availableTunes.find((t) => t.id === tunesDrop.value.toString())
    if(tune) {
      tune.tune.forEach((t) => {
        handlePlayTune(t.note, t.timing)
      })
    }
  }
  const handlePianoKey = (e) => {
    const isKeydown = e.type === 'keydown'
    // Premature return if the key is not in the piano key list
    if(isKeydown && !keys[e.code])
      return
    // If key is already down, do not play the tune
    if(isKeyDown)
      return

    const pianoKey = isKeydown ? keys[e.code] : e.target.id

    handlePlayTune(pianoKey)

    if(isKeydown) {
      isKeyDown = true
    }

    if(isRecording) {
      recordedTunes.push({
        note: pianoKey,
        duration: '8n',
        timing: clock
      })
    }
  }

  const handleStartRecording = () => {
    recordBtn.setAttribute('disabled', 'true')
    stopBtn.removeAttribute('disabled')
    isRecording = true
    clockInterval = setInterval(() => {
        clock += 0.1
    }, 100)
  }
  const handleStopRecording = () => {
    stopBtn.setAttribute('disabled', 'true')
    recordBtn.removeAttribute('disabled')
    isRecording = false
    clearInterval(clockInterval)
    clock = 0

    if(!recordedTunes.length) {
      alert('Nothing has been recorded')
      resetAfterSaving()
      return
    }

    if(!recordName)
      recordName = 'No-name Tune'

    const data = {
      name: recordName,
      tune: recordedTunes
    }

    postTune(data)
  }
  const handleRecordNameInput = (e) => {
    recordName = e.target.value
    stopPropagation(e)
  }
  const stopPropagation = (e) => {
    e.stopPropagation()
  }
  const resetAfterSaving = () => {
    recordName = 'No-name Tune'
    recordedTunes = []
    isRecording = false
    recordBtn.removeAttribute('disabled')
    stopBtn.setAttribute('disabled', 'true')
    recordNameInput.value = ''
    clearInterval(clockInterval)
    clock = 0
  }
  const detachKey = (e) => {
    if(!keys[e.code]) return
    isKeyDown = false
  }

  // API calls
  const fetchTunes = () => {
    axios.get(API_TUNES_URL)
        .then((res) => {
          availableTunes = [...res.data]
          tunesDrop.innerHTML = ''
          availableTunes.forEach((tune) => {
            const node = document.createElement('option')
            node.setAttribute('value', tune.id)
            node.innerText = tune.name
            tunesDrop.appendChild(node)
          })
        })
  }
  const postTune = (data) => {
    axios.post(API_TUNES_URL, data).then(() => {
      fetchTunes()
    }).catch(() => {
      alert('Error has occurred while trying to save your tune')
    })
    .finally(() => {
      resetAfterSaving()
    })
  }

  // Listeners
  pianoKeys.forEach((key) => {
    key.addEventListener('click', handlePianoKey)
  })
  document.addEventListener('keydown', handlePianoKey)
  recordNameInput.addEventListener('keydown', handleRecordNameInput)
  recordNameInput.addEventListener('keyup', stopPropagation)
  document.addEventListener('keyup', detachKey)
  playButton.addEventListener('click', playSelectedTune)
  recordBtn.addEventListener('click', handleStartRecording)
  stopBtn.addEventListener('click', handleStopRecording)
  fetchTunes()
}


// On document ready
document.addEventListener('DOMContentLoaded', main)
