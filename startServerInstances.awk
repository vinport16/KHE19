BEGIN{
  #FFA server: 
  system("npm start 3031 maps/islands.json &");

  #CTF server: 
  system("npm start 3032 maps/treeHouse.json &");

  #TEAMS server: 
  #system("npm start 3033 maps/islands.json &");

  #KOTH server: 
  system("npm start 3034 maps/KOTHMountian.json &");
}