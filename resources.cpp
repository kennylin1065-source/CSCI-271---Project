#include "resources.h"

void addResources(int &oxygen, int &food, int &power, int H2O, int hFood, int hPower, int efficiency) {
    oxygen += (H2O * efficiency);
    food += (hFood * efficiency);
    power += (hPower * efficiency);
}

void drainResources(int &oxygen, int &food, int &power) {
    oxygen -= 25; // I change this part and increased from 10
    food -= 20;// I change this part and increased from 10
    power -= 30;// power is now the hardest to manage 

 if(oxygen > 100) oxygen= 100;
 if(food > 100) food = 100;
if(power > 100) power = 100;

}
