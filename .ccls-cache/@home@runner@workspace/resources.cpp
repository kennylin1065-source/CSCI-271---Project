#include "resources.h"
#include <iostream>
using namespace std;

void drainResources(int &oxygen, int &food, int &power) {
    oxygen -= 10;
    food -= 10;
    power -= 10;
    cout << ">>ALERT: Daily life support consumed 10 units of all resources." << endl;
}

void addResources(int &oxygen, int &food, int &power, int hO2, int hFood, int hPower, int efficiency) {
    oxygen += hO2 * efficiency;
    food += hFood * efficiency;
    power += hPower * efficiency;
}