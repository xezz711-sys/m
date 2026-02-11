#bridge-file-version: #25
execute as @s[hasitem={item=potato,quantity=1..}] run setblock ~ ~ ~ potatoes
execute as @s[hasitem={item=potato,quantity=1..}] run clear @s potato 0 1