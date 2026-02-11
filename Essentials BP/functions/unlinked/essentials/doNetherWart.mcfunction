#bridge-file-version: #13
execute as @s[hasitem={item=nether_wart,quantity=1..}] run setblock ~ ~ ~ nether_wart
execute as @s[hasitem={item=nether_wart,quantity=1..}] run clear @s carrot 0 1