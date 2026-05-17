#ifndef SCORING_H
#define SCORING_H
#include <string>

int calculateScore(int oxygen, int food, int power, int solsSurvived, bool won);
std::string getCommanderRank(int score);
void displayFinalScore(int oxygen, int food, int power, int solsSurvived, bool won);

#endif
