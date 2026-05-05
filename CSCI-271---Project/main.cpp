#include <iostream>
#include <cstdlib>
#include <ctime>
#include "resources.h"
using namespace std;
int main(){
srand(time(0)); // this is going to be my seed random function
int sol=1;       // this part is resources 
int oxygen = 50;
int food = 50;
int power = 50;
  bool gameOver = false;

  // this part i am doing the While loop
  while(sol <= 20 && ! gameOver){
    cout<<"\nsol "<<sol<<endl;
    cout<< "oxygen: " <<oxygen<< " Food " <<food <<" Power "<<power<<endl;
    sol++;

    // I create variables for my player choice 
   int H2O, hFood, hPower;
    cout <<"you have 10 hours. How many for Oxygen, Food, and Power? ";
    cin>> H2O >> hFood >> hPower;
    cout<<"you chose " << H2O <<" ho2 "<< hFood <<" Food, "<< hPower <<" Power "<<endl;

  // theis is where i am going to check if player lost
 if (oxygen <= 0 && food <= 0 && power <=0){
   cout<<"\nMISSION FAILD: you ran out of resources on Sol"<<sol<< "☹️!"<<endl;
   gameOver = true;
 }

 // This is where i am going to Generate a random number for the day (between 3 and 8)
      int number = rand() % 6 + 3; // Keep this to generate the efficiency
      addResources(oxygen, food, power, H2O, hFood, hPower, number);
      drainResources(oxygen, food, power);
    
     
      
    // this is going to tell the player how the day went
    cout<<"Crew efficiency today: "<<number<<" units per hour."<<endl;

  }
  if(!gameOver){
    cout<<"\nCONGRATULATION PLAYER! YOU HAVE SURVUVED 20 SOLS ON MARS! " <<endl;
  }
return 0;
}




