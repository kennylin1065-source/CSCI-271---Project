#include <iostream>
#include <string>
#include "scoring.h"
using namespace std;

int calculateScore(int oxygen, int food, int power, int solsSurvived, bool won) {
    if (won) {
        int survivalBonus = 1000;
        int solBonus = solsSurvived * 20;       // +20 per sol, max +400
        int efficiency = oxygen + food + power;  // +1 per remaining unit
        return survivalBonus + solBonus + efficiency;
    } else {
        int solBonus = solsSurvived * 20;

        // -30 for each resource that hit zero
        int depletedPenalty = 0;
        if (oxygen <= 0) depletedPenalty += 30;
        if (food <= 0)   depletedPenalty += 30;
        if (power <= 0)  depletedPenalty += 30;

        // -10 for each sol short of 20
        int solPenalty = (20 - solsSurvived) * 10;

        int total = solBonus - depletedPenalty - solPenalty;
        return max(0, total);
    }
}

string getCommanderRank(int score) {
    if (score >= 1500) return "Martian Legend";
    if (score >= 1200) return "Senior Commander";
    if (score >= 800)  return "Field Commander";
    if (score >= 400)  return "Junior Commander";
    return "Rookie Commander";
}

void displayFinalScore(int oxygen, int food, int power, int solsSurvived, bool won) {
    int score = calculateScore(oxygen, food, power, solsSurvived, won);
    string rank = getCommanderRank(score);

    cout << "\n========================================" << endl;
    cout << "           MISSION DEBRIEF              " << endl;
    cout << "========================================" << endl;

    if (won) {
        cout << "Survival Bonus: +1000 pts" << endl;
        cout << "Sol Bonus: +" << (solsSurvived * 20) << " pts (" << solsSurvived << " sols x 20)" << endl;
        cout << "Resource Efficiency: +" << (oxygen + food + power) << " pts" << endl;
        cout << "  Oxygen: " << oxygen << "  Food: " << food << "  Power: " << power << endl;
    } else {
        int depletedPenalty = 0;
        if (oxygen <= 0) depletedPenalty += 30;
        if (food <= 0) depletedPenalty += 30;
        if (power <= 0) depletedPenalty += 30;
        int solPenalty = (20 - solsSurvived) * 10;
        cout << "Sol Bonus: +" << (solsSurvived * 20) << " pts" << endl;
        cout << "Depleted resources: -" << depletedPenalty << " pts" << endl;
        cout << "Sols short of 20: -" << solPenalty << " pts" << endl;
    }

    cout << "----------------------------------------" << endl;
    cout << "FINAL SCORE: " << score << " pts" << endl;
    cout << "COMMANDER RANK: " << rank << endl;
    cout << "========================================\n" << endl;
}
