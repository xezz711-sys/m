#bridge-file-version: #19
execute as @s[hasitem={item=wheat_seeds,quantity=1..}] run setblock ~ ~ ~ wheat
execute as @s[hasitem={item=wheat_seeds,quantity=1..}] run clear @s wheat_seeds 0 1