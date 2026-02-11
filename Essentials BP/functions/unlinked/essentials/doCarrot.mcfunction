#bridge-file-version: #13
execute as @s[hasitem={item=carrot,quantity=1..}] run setblock ~ ~ ~ carrots
execute as @s[hasitem={item=carrot,quantity=1..}] run clear @s carrot 0 1