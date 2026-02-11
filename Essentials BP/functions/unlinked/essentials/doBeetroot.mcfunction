#bridge-file-version: #26
execute as @s[hasitem={item=beetroot_seeds,quantity=1..}] run setblock ~ ~ ~ beetroot
execute as @s[hasitem={item=beetroot_seeds,quantity=1..}] run clear @s beetroot_seeds 0 1