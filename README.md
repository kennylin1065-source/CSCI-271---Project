**Martian Outpost: Sol 20**

**Team Members**
Leonardo Alexander (EMPLID: 24661315) — GitHub: @alexanderleonardo228-web

Kenny Lin (EMPLID: 24307886) — GitHub: @kennylin1065-source

Joel Rivera (EMPLID: 24647409) — GitHub: @joel-r4

**Game Description**
- Martian Outpost: Sol 20 is a text-based resource management survival game built in C++. The player takes on the role of a Commander overseeing a small colony on Mars. The objective is to keep the colony alive for 20 Sols (Martian days) until a rescue ship arrives.

- The player must manage three critical resources: Oxygen, Food, and Power. Each Sol, the player is given 10 Crew Hours to distribute across the three resource systems: Oxygen production, Food farming, and Power generation. Smart allocation is the key to survival.

- Mars is unforgiving. Random events such as dust storms, equipment malfunctions, or, on rare occasions, lucky supply drops will shake up the colony's resource levels, forcing the Commander to constantly adapt and make strategic trade-offs under pressure.

- This game can be played solo or with friends but the goal remains the same.

**Screen Messages
The game communicates to the player through a series of structured console messages:**

**Game start:** 
--- WELCOME TO MARTIAN OUTPOST: SOL 20 --- / Survive 20 days to reach the rescue ship.

**Each Sol header:**
SOL: X | Population: Y | Oxygen: Z% | Food: Z units | Power: Z%

**Crew allocation prompt:**
You have 10 crew hours. Allocate them: Hours for Oxygen / Food / Power:

**Over-allocation warning:**
You overtasked the crew! They worked inefficiently.
Random event notification

**Event-specific messages:** 
(e.g., DUST STORM! Power reduced by 20.)

**Resource depletion:**
CRITICAL FAILURE: Resources depleted. MISSION FAILED. Mars is a harsh mistress.

**Victory:**
CONGRATULATIONS! The rescue ship has arrived.

**Final score display:**
Final Score: XXXX — Commander Rank: [Rank]


**Rules**
- Survival Condition: If any of the three resources — Oxygen, Food, or Power — reach 0 or below, the game ends immediately as a Mission Failed.

- Daily Crew Allocation: Each Sol, the player has 10 Crew Hours to distribute across Oxygen production, Food farming, and Power generation. Hours must be whole numbers.

- Over-Allocation Penalty: If the player assigns more than 10 total hours, the crew works inefficiently, and resource gains are reduced/penalized.

- Daily Consumption: At the end of every Sol, the colony automatically consumes a fixed amount of each resource based on the current population (default: 10 units per resource per Sol).

- Random Events: One random event fires each night (after consumption). Events can be harmful (e.g., dust storms, equipment failures) or rarely beneficial (e.g., supply drops). The player cannot prevent them... only prepare for them.

- Win Condition: Survive all 20 Sols and the rescue ship arrives. Any Sol where all three resources remain above 0 counts as a survived day.

**Scoring**
Points are calculated and displayed at the end of Sol 20 (victory only):

Survival Bonus: 1,000 points for successfully reaching Sol 20

Resource Efficiency: 1 point per remaining unit of Oxygen, Food, and Power

Total: Survival Bonus + (Oxygen + Food + Power remaining)

**Commander Rank Thresholds**

**Score Range           Rank**
1,000 – 1,099         Rookie Commander

1,100 – 1,199         Junior Commander

1,200 – 1,349         Field Commander

1,350 – 1,499         Senior Commander

1,500+                Martian Legend


**Who's Doing What**

Leonardo:
Core game loop, state management, resource calculation logic, and daily consumption balancing

Kenny:
Random event generator (using rand()), event messages, and survival/game-over condition checks

Joel:
User input handling, input validation, ASCII art UI/headers, and the final scoring + rank system
