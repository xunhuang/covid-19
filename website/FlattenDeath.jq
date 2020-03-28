
[ . | 
with_entries(select(.key != "Summary")) |to_entries  |.[] |.value  | 
with_entries(select(.key != "Summary")) |to_entries | .[] |.value |
select( .CountyName!=null) |  
.Death += {
    "00CountyName":.CountyName, 
    "00StateName":.StateName, 
    "00StateFIPS":.StateFIPS, 
    "00CountyFIPS":.CountyFIPS 
    } 
    |.Death ]
