from gpiozero import LED
from time import sleep

clop = LED(17)
neigh = LED(27)

while True:
	clop.on()
	neigh.off()
	sleep(1)
	clop.off()
	neigh.on()
	sleep(1)

	clop.off()
	neigh.off()
	sleep(2)
