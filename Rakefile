RHINO = "java -cp $RHINO_HOME:$XBEAN_HOME:$CLASSPATH org.mozilla.javascript.tools.shell.Main"

task :doc do
  sh "cd ../osdoc && #{RHINO} osdoc.run.js ../processes/processes.js > ../processes/processes.api.html"
end
