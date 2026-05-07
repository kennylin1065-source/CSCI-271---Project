#include <iostream>
#include <cstdlib>
#include <ctime>
#include "resources.h"
#include "events.h"

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
    cout<<"+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++\n";
    cout <<"you have 10 hours. How many Oxygen do you want ? ";
    cin>> H2O;
    cout<<"you have 10 hours. How many Food do you want: ?";
    cin>>hFood;
    cout<<"you have 10 hours. How many Power do you want";
    cin>>hPower;
    cout << "you chose " << H2O << " H2O💧 " << hFood << " Food " << hPower << " Power " << endl;
    cout<<"+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++\n";
  // theis is where i am going to check if player lost
 if (oxygen <= 0 && food <= 0 && power <=0){
   cout<<"\nMISSION FAILD: you ran out of resources on Sol"<<sol<< "☹️!"<<endl;
   gameOver = true;
 }

 // This is where i am going to Generate a random number for the day (between 3 and 8)
      int number = rand() % 5 + 1; // I updated this befor it was between 3 and 8 if i did not change it the player would be swimming in resources if they get a 8 all the time.
      addResources(oxygen, food, power, H2O, hFood, hPower, number);
      drainResources(oxygen, food, power);
      randomEvent(oxygen, food, power);  // ← add this line


    // this is going to tell the player how the day went
    cout<<"Crew efficiency today: "<<number<<" units per hour."<<endl;
   cout<<"++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++\n";
  }
  if(!gameOver){
    cout<<"\nCONGRATULATION PLAYER! YOU HAVE SURVUVED 20 SOLS ON MARS! " <<endl;
  }
return 0;
}

  


  

