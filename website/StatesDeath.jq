
[ . | 
with_entries(select(.key != "Summary")) |to_entries  |.[] |.value  
|.Summary 
|select( .StateFIPS!=null) 
|select( .StateFIPS!="undefined") 
| .Death += {
    "00StateFIPS":.StateFIPS, 
    } 
    |.Death ]