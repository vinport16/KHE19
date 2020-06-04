BEGIN{
  #system("sed -i "" '/^[[:space:]]*$/d' pids.txt");
  while(getline < "pids.txt" > 0){
    if($0 != ""){
      system("kill " $0)
    }    
  }
  print "" > "pids.txt"
  #system("sed -i "" '/^[[:space:]]*$/d' pids.txt");

  #FFA server: 
  system("npm start 3031 maps/islands.json &");

  #CTF server: 
  system("npm start 3032 maps/treeHouse.json &");

  #TEAMS server: 
  #system("npm start 3033 maps/islands.json &");

  #KOTH server: 
  system("npm start 3034 maps/KOTHMountian.json &");
}