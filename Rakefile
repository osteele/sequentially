MIN = 'sequentially.min.js'
MIN_GZ = MIN + '.gz'
RHINO = "java -cp $RHINO_HOME:$XBEAN_HOME:$CLASSPATH org.mozilla.javascript.tools.shell.Main"

task :publish => MIN_GZ do
  sh "rsync -avz . osteele.com:osteele.com/sources/javascript/sequentially --delete"
end

file MIN => %w[sequentially.js] do |t|
  sh "cat #{t.prerequisites} | ruby ~/src/javascript/jsmin.rb > #{t.name}"
end

file MIN_GZ => MIN do |t|
  sh "gzip < #{t.prerequisites} > #{t.name}"
  puts "#{File.size(t.name)} bytes"
end

task :doc do
  sh "cd ../osdoc && #{RHINO} osdoc.run.js ../processes/processes.js > ../processes/processes.api.html"
end
