
[ . | 
with_entries(select(.key != "Summary")) |to_entries  |.[] |.value  
|.Summary 
|select( .StateFIPS!=null) 
|select( .StateFIPS!="undefined") 
| .Confirmed += {
    "00StateFIPS":.StateFIPS, 
    } 
    |.Confirmed ]