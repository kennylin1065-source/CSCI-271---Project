#include <iostream>
#include <cstdlib>
#include "resources.h"
using namespace std;

void randomEvent(int& oxygen, int& food, int& power) {
    int event = rand() % 8; // 8 possible events

    cout << "\n--- NIGHTLY EVENT REPORT ---" << endl;

    switch (event) {
        case 0:
            cout << "⚡ DUST STORM! Solar panels are damaged." << endl;
            power -= 20;
            break;
        case 1:
            cout << "🌬️ OXYGEN LEAK detected in Habitat B!" << endl;
            oxygen -= 20;
            break;
        case 2:
            cout << "🐛 CROP BLIGHT! A fungus hit the food supply." << endl;
            food -= 20;
            break;
        case 3:
            cout << "🔥 ELECTRICAL FIRE! Power and Oxygen taking damage." << endl;
            power -= 15;
            oxygen -= 10;
            break;
        case 4:
            cout << "☀️  CLEAR SKIES! Solar panels running at peak efficiency." << endl;
            power += 10;
            break;
        case 5:
            cout << "🌱 BUMPER HARVEST! The greenhouse overproduced today." << endl;
            food += 10;
            break;
        case 6:
            cout << "🔧 REPAIR CREW SUCCESS! Oxygen systems optimized." << endl;
            oxygen += 10;
            break;
        case 7:
            cout << "😴 ROUTINE DAY. No events to report, Commander." << endl;
            break;
    }

    // make sure nothing goes below 0 or above 100
    if (oxygen < 0) oxygen = 0;
    if (food < 0) food = 0;
    if (power < 0) power = 0;
    if (oxygen > 100) oxygen = 100;
    if (food > 100) food = 100;
    if (power > 100) power = 100;

    cout << "----------------------------" << endl;
}
