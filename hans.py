#!/usr/bin/env python3

from grammar import HansVisitor
from parsimonious.exceptions import ParseError
import speech_recognition as sr

from gpiozero import LED
from time import sleep

class Horse(object):

    visitor = HansVisitor()

    neigh_button = LED(27)
    clop_button = LED(17)

    def __init__(self):
        self.recognizer = sr.Recognizer()
        self.mic = sr.Microphone(device_index=2,sample_rate=44100,chunk_size=128)
        with self.mic as source:
            self.recognizer.adjust_for_ambient_noise(source)

        self.start_listening()

    def start_listening(self):
        def handle(recognizer,audio):
            self.handle_phrase(recognizer,audio)
        self.stop_listening = self.recognizer.listen_in_background(self.mic, handle)

    def neigh(self):
        self.neigh_button.on()
        sleep(2)
        self.neigh_button.off()

    def clop(self,n):
        self.clop_button.on()
        sleep(n/2)
        self.clop_button.off()

    def handle_phrase(self,recognizer,audio):
        print("GOT")
        try:
            text = self.recognizer.recognize_google(audio).strip().lower()
            print("Google Speech Recognition thinks you said " + text)
            try:
                question,result = self.visitor.parse(text)
                if question == 'love':
                    print("Hans loves you too!")
                    self.neigh()
                else:
                    result = int(result)
                    print("It's {}".format(result))
                    if result<=0 or result>100:
                        self.neigh()
                    else:
                        self.clop(result)
            
            except ParseError:
                print("Neigh!")
                self.neigh()

        except sr.UnknownValueError:
            print("Google Speech Recognition could not understand audio")
            return
        except sr.RequestError as e:
            print("Could not request results from Google Speech Recognition service; {0}".format(e))

hans = Horse()

while True: 
    sleep(0.1)
