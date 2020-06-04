BEGIN{
  #system("sed -i "" '/^[[:space:]]*$/d' pids.txt");
  while(getline < "pids.txt" > 0){
    if($0 != ""){
      system("kill " $0)
    }    
  }
  print "" > "pids.txt"
  #system("sed -i "" '/^[[:space:]]*$/d' pids.txt");

  #Port 3030:
  system("npm start config3030.txt &");

  #Port 3031: 
  system("npm start config3031.txt &");

  #Port 3032: 
  system("npm start config3032.txt &");

  #Port 3033
  system("npm start config3033.txt &");
}