#!/usr/bin/env python3

from grammar import HansVisitor
from parsimonious.exceptions import ParseError
import speech_recognition as sr

from gpiozero import LED
from time import sleep

visitor = HansVisitor()

neigh_button = LED(27)
clop_button = LED(17)

def neigh():
    neigh_button.on()
    sleep(2)
    neigh_button.off()

def clop(n):
    clop_button.on()
    sleep(n/2)
    clop_button.off()

def handle_phrase(recognizer,audio):
    print("GOT")
    try:
        text = recognizer.recognize_google(audio).strip().lower()
        print("Google Speech Recognition thinks you said " + text)
        try:
            question,result = visitor.parse(text)
            if question == 'love':
                print("Hans loves you too!")
                neigh()
            else:
                result = int(result)
                print("It's {}".format(result))
                clop(result)
        except ParseError:
            print("Neigh!")
            neigh()
    except sr.UnknownValueError:
        print("Google Speech Recognition could not understand audio")
        return
    except sr.RequestError as e:
        print("Could not request results from Google Speech Recognition service; {0}".format(e))

r = sr.Recognizer()
m = sr.Microphone(device_index=2,sample_rate=44100,chunk_size=512)
with m as source:
    r.adjust_for_ambient_noise(source)

stop_listening = r.listen_in_background(m, handle_phrase)

while True: 
    sleep(0.1)
