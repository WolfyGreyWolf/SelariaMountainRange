function LinkCheck(url) {
  try {
    http = new XMLHttpRequest();
    http.open("GET", url, false);
    http.send();
    return http.status != 404;
  } catch (Errors) {
    console.info("File " + url + " don't exist !");
  }
}

var FileToSave = "";
var CommandsDescriptions = {};

function Process(CommandStringBase) {
  for (Item in CommandStringBase.split(" && ")) {
    FileToSave = "";
    var CommandString = CommandStringBase.split(" && ")[Item];
    // Get the base command and the arguments !
    delete BashCommand;
    var BashCommand = {
      Base: CommandString.split(" ")[0],
      Arguments: [],
      SubCommands: [],
    };
    if(CommandString.indexOf(" > ") > -1){
      FileToSave = CommandString.split(" > ")[1];
      CommandString = CommandString.substring(0 , CommandString.indexOf(" > "));
    }
    for (Item in CommandString.split(" ")) {
      if (Item != 0) {
        if (CommandString.split(" ")[Item].slice(0, 1) == "-") {
          BashCommand.Arguments.push(
            CommandString.split(" ")[Item].replace("-", "")
          );
        } else {
          BashCommand.SubCommands.push(CommandString.split(" ")[Item]);
        }
      }
    }
    // Process the command !
    switch (BashCommand["Base"]) {
      // Bash Commands !
      default:
        if (FileSystem.fileExists("/bin/" + BashCommand["Base"] + "/" + BashCommand["Base"])) {
          var KeepLastDir = false;
          var TerminalDir = FileSystem.CWD();
          FileSystem.changeDir("/bin/" + BashCommand["Base"] + "/" + BashCommand["Base"]);
          var CommandContent = new Function(FileSystem.getFileContent("/bin/" + BashCommand["Base"] + "/" + BashCommand["Base"]).result);
          Terminal.echo(CommandContent());
          if(KeepLastDir == undefined || KeepLastDir == false){
            FileSystem.changeDir(TerminalDir);
          }
        } else {
          if (LinkCheck("/Kernel/SBash/Commands/" + BashCommand["Base"] + ".js")) {
            http = new XMLHttpRequest();
            http.open(
              "GET",
              "/Kernel/SBash/Commands/" + BashCommand["Base"] + ".js",
              false
            );
            http.send();
            var RequestResponse = new Function(
              "var BashCommand = " +
                JSON.stringify(BashCommand) +
                " ; " +
                "var CommandString = '" +
                CommandString +
                "' ; " +
                http.responseText
            );
            RequestResponse();
          } else {
            if(LinkCheck("/System/Programs/"+BashCommand["Base"]+"/App.html")){
              Shell.CreateWindow({Name : BashCommand["Base"] , "NoMenu" : "" , Arguments : BashCommand["SubCommands"].join("")});
            }else{
              return BashCommand["Base"] + " : Commande introuvable";
            }
          }
        }
        break;
      case "help":
        return `
List of integrated commands !

help , cd , ls , nano , cat , touch , mkdir , rm , rmdir , echo , clear , selaria , ssc , halt , reboot

(
  ssc :
   ssc shell
   ssc boot
)

(
  selaria :
   selaria test
   selaria conf
)
        `;
        break;
      case "apt":
        if(BashCommand["SubCommands"][0] == "install"){
          for(Repository in FileSystem.getFileContent("/etc/repositories.conf").result.split("\n")){
            if(FileSystem.getFileContent("/etc/repositories.conf").result.split("\n")[Repository] != ""){
              var Version = ""
              if(BashCommand["Arguments"].indexOf("v") > -1){
                Version = "-" + BashCommand["SubCommands"][2];
              }
              try{
                http = new XMLHttpRequest();
                http.open(
                "GET",
                "https://raw.githubusercontent.com/"+FileSystem.getFileContent("/etc/repositories.conf").result.split("\n")[Repository]+"/main/Packages/"+BashCommand["SubCommands"][1] + Version +"/"+BashCommand["SubCommands"][1],
                false
                );
                http.send();
                if(BashCommand["Arguments"].indexOf("p") == -1){
                  Version = ""
                }
                if(http.responseText != "404: Not Found"){
                  FileSystem.createDir("/bin/" , BashCommand["SubCommands"][1]+Version);
                  FileSystem.writeFile("/bin/"+BashCommand["SubCommands"][1]+Version+"/"+BashCommand["SubCommands"][1]+Version , http.responseText);
                  break;
                }
              }catch(Error){
                Terminal.echo("TEST : "+FileSystem.getFileContent("/etc/repositories.conf").result.split("\n")[Repository]+" , not contain the software !");
              }
            }
          }
        }else{
          if(BashCommand["SubCommands"][0] == "remove"){
            var Version = "";
            if(BashCommand["Arguments"].indexOf("v") > -1){
              Version = "-" + BashCommand["SubCommands"][2];
            }
            FileSystem.delete("/bin/"+BashCommand["SubCommands"][1]+Version);
          }
        }
        break;
      case "add-apt-repository":
        if(BashCommand["Arguments"].indexOf("-remove") > -1){
          var Repositories = FileSystem.getFileContent("/etc/repositories.conf").result.split("\n");
          for(Line in Repositories){
            if(Repositories[Line] == BashCommand["SubCommands"][0]){
              Repositories.splice(Line , 1);
              FileSystem.writeFile("/etc/repositories.conf" , Repositories.join("\n"));
              break;
            }
          }
        }else{
          FileSystem.writeFile("/etc/repositories.conf" , BashCommand["SubCommands"][0]+"\n" , true);
        }
        break;
      case "cd":
        if (BashCommand["SubCommands"] != []) {
          FileSystem.changeDir(BashCommand["SubCommands"][0]);
        } else {
          return FileSystem.CWD();
        }
        break;
      case "ls":
        if (CommandString == "ls") {
          BashCommand["SubCommands"][0] = "./";
        }
        var Content = FileSystem.getDirContent(
          BashCommand["SubCommands"][0]
        ).result;
        ContentOfFolder = [];
        for (FileSystemObject in Content) {
          ContentOfFolder.push(Content[FileSystemObject].name);
        }
        return ContentOfFolder.join("     ");
        break;
      case "nano":
        var TextEditor = Shell.CreateWindow({
          Name: "TextEditor",
          Title:
            "Text Editor : " +
            FileSystem.CWD() +
            "/" +
            BashCommand["SubCommands"][0],
          Icon: "/System/Assets/Softwares/TextEditor/Icon.svg",
          Arguments:
            "FileURL=" + FileSystem.CWD() + "/" + BashCommand["SubCommands"][0],
          NoMenu: "",
        });
        TextEditor.Controller.FileSystem = new FFS(FileSystem.Partition);
        break;
      case "mkdir":
        FileSystem.createDir(FileSystem.CWD(), BashCommand["SubCommands"][0]);
        break;
      case "touch":
        FileSystem.createFile(
          FileSystem.CWD(),
          BashCommand["SubCommands"][0],
          ""
        );
        break;
      case "cp":
        FileSystem.copy(BashCommand["SubCommands"][0] , BashCommand["SubCommands"][1]);
        break;
      case "mv":
        FileSystem.move(BashCommand["SubCommands"][0] , BashCommand["SubCommands"][1]);
        break;
      case "cat":
        return FileSystem.getFileContent(BashCommand["SubCommands"][0]).result;
        break;
      case "rm":
        FileSystem.delete(BashCommand["SubCommands"][0]);
        break;
      case "rmdir":
        FileSystem.delete(BashCommand["SubCommands"][0]);
        break;
      case "echo":
        return CommandString.replace("echo ", "");
        break;
      case "clear":
        Terminal.clear();
        break;
      case "reboot":
        Kernel.Reload();
        break;
      case "wget":
        http = new XMLHttpRequest();
        http.open("GET",CommandString.replace("wget " , ""),false);
        http.send();
        return http.responseText;
        break;
      case "halt":
        Kernel.document.querySelector("#DE").src = "about:blank";
        Kernel.document.querySelector("#DE").getElementsByClassName.display = "none";
        break;
      // Selaria commands !
      case "selaria":
        switch (BashCommand["SubCommands"][0]) {
          case "test":
            return "Selaria MountainRange Test !";
            break;
          case "conf":
            switch (BashCommand["SubCommands"][1]) {
              case "reload":
                Shell.ReloadConfig();
            }
            break;
        }
        break;
    }
  }
}