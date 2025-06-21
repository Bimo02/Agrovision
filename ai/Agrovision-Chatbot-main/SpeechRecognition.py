import os
import speech_recognition as sr
import langid
import pyttsx3
import pyaudio
import pygame
from gtts import gTTS
from dotenv import load_dotenv
from faster_whisper import WhisperModel
import google.generativeai as genai
from openai import OpenAI
import constants
import edge_tts
import asyncio
from pydub import AudioSegment
import tempfile
import warnings
warnings.filterwarnings("ignore", message=r"torch.utils._pytree._register_pytree_node is deprecated")
 

from pydub import AudioSegment
from pydub.playback import play
def recognize_speech():
    reconizer = sr.Recognizer()
    
    with sr.Microphone() as source:
        print("Listening ...")
        reconizer.adjust_for_ambient_noise(source, duration=1)
        audio = reconizer.listen(source,timeout=5, phrase_time_limit=10)
    
    try:
        user_prompt = reconizer.recognize_google(audio)
        print(f"You said: {user_prompt}")
        return user_prompt
    
    except sr.UnknownValueError:
        print("I couldn't understand what you said.")
        exit()
    
    except sr.RequestError as e:
        print("Could not connect to Google Speech.")
        exit()
def recognize__speech(audio_path: str , language: str = "auto") -> str:
    """
    Converts an audio file (WAV/MP3/WEBM) to text using Google Speech Recognition.
    """
    recognizer = sr.Recognizer()
    converted_path = None  # Track if we create a converted file
    
    try:
        # Convert to WAV if needed
        if audio_path.lower().endswith(('.mp3', '.webm')):
            if audio_path.lower().endswith('.mp3'):
                audio = AudioSegment.from_mp3(audio_path)
            else:  # .webm
                audio = AudioSegment.from_file(audio_path, format="webm")
            
            wav_path = os.path.splitext(audio_path)[0] + ".wav"
            audio.export(wav_path, format="wav")
            converted_path = wav_path
            audio_path = wav_path
        
        # Process the audio file
        with sr.AudioFile(audio_path) as source:
            audio = recognizer.record(source)
        
        # Recognize speech (auto-detects language)
        # user_prompt = recognizer.recognize_google(audio , language = ["ar-EG","en-US"])
        # print(f"Recognized: {user_prompt}")
        # return user_prompt
        try:
            if language == "auto":
                user_prompt = recognizer.recognize_google(audio, language="ar-EG")
                print(f"Recognized: {user_prompt}")
            else:
                user_prompt = recognizer.recognize_google(audio, language=language)
                print(f"Recognized: {user_prompt}")
            return user_prompt
        except sr.UnknownValueError:
            if language == "auto":
                print("Arabic not detected, trying English...")
                user_prompt = recognizer.recognize_google(audio, language="en-US")
                print(f"Recognized: {user_prompt}")
                return user_prompt
            else:
                raise 
    
    except sr.UnknownValueError:
        raise ValueError("Could not understand audio.")
    except sr.RequestError as e:
        raise ValueError(f"Speech recognition error: {str(e)}")
    except Exception as e:
        raise ValueError(f"Audio processing failed: {str(e)}")
    finally:
        # Clean up converted WAV file if we created one
        if converted_path and os.path.exists(converted_path):
            os.remove(converted_path)
    
def text_to_speech(text):
    spoken_response = text.replace('*', '')
    tts_engine = pyttsx3.init()
    tts_engine.setProperty('rate', 160) 
    voices = tts_engine.getProperty('voices')
    tts_engine.setProperty('voice', voices[1].id) #changing index changes voices but ony 0(male) and 1(female) are working here
    tts_engine.say(spoken_response)
    tts_engine.runAndWait()           
LANG_VOICE_MAP = {
    "en": "en-GB-RyanNeural",  # English (UK, Male)
    "ar": "ar-SA-HamedNeural",  # Arabic (Male)
    "fr": "fr-FR-DeniseNeural",  # French (Female)
    "es": "es-ES-AlvaroNeural",  # Spanish (Male)
    "ar": "ar-EG-SalmaNeural",
    "ar": "ar-EG-ShakirNeural"
    # Add more languages as needed
}
async def generate_speech(text, filename="output.mp3"):
    # Remove special characters
    spoken_response = text.replace('*', '').replace('\n', '').replace('#', '')

    # Identify language
    language_code, _ = langid.classify(spoken_response)
    voice = LANG_VOICE_MAP.get(language_code, "ar-EG-ShakirNeural")  # Default to English if not found

    # Generate speech
    tts = edge_tts.Communicate(spoken_response, voice)
    await tts.save(filename)

def voice(text, filename="output.mp3"):
    # Generate speech using Edge-TTS
    asyncio.run(generate_speech(text, filename))

    # Play the audio file using Pygame
    pygame.mixer.init()
    pygame.mixer.music.load(filename)
    pygame.mixer.music.play()

    # Wait for playback to finish
    while pygame.mixer.music.get_busy():
        pygame.time.Clock().tick(10)

    # Stop and quit Pygame
    pygame.mixer.music.stop()
    pygame.mixer.quit()

    # Delete the audio file
    os.remove(filename)
     
load_dotenv()
GOOGLE_API_KEY = genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
OPENAI_API_KEY = os.environ["OPENAI_API_KEY"] = constants.OPENAI_API_KEY
client = OpenAI(api_key=OPENAI_API_KEY)

reconizer = sr.Recognizer()
source = sr.Microphone()

whisper_size = 'small'
num_cores = os.cpu_count()
whisper_model = WhisperModel(whisper_size, device='cpu', compute_type='int8', cpu_threads=num_cores, num_workers=num_cores)

def process_user_voice():
    with source as s:
        reconizer.adjust_for_ambient_noise(s, duration=3)
        print("\nListening ... \n")
        audio = reconizer.listen(source, timeout=5, phrase_time_limit=10)
    try:
        prompt_audio_path = 'prompt.wav'
        with open(prompt_audio_path, 'wb') as f:
            f.write(audio.get_wav_data())
        prompt_text = wav_to_text(prompt_audio_path)
        if len(prompt_text.strip()) < 3:  # Check for very short input
            print("No input detected. Please try again.")
            return None
        else:
            print('user: ' + prompt_text)
            return prompt_text
    except Exception as e:
        print('prompt error: ', e)
        return None
    
def speek(text):
    player_stream = pyaudio.PyAudio().open(format = pyaudio.paInt16, channels=1, rate=24000, output=True)
    stream_start = False
    with client.audio.speech.with_streaming_response.create(
        model = "tts-1",
        voice="puck",
        response_format= "pcm",
        input= text,
    ) as response:
        silence_threshold = 0.01
        for chunk in response.iter_bytes(chunk_size=1024):
            if stream_start:
                player_stream.write(chunk)
            elif max(chunk) > silence_threshold:
                player_stream.write(chunk)
                stream_start = True   

def wav_to_text(audio_path):
    segments, _ = whisper_model.transcribe(audio_path)
    text = ''.join(segment.text for segment in segments)
    return text