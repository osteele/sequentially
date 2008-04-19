MIN = 'sequentially.min.js'
MIN_GZ = MIN + '.gz'
RHINO = "java -cp $RHINO_HOME:$XBEAN_HOME:$CLASSPATH org.mozilla.javascript.tools.shell.Main"

desc "Upload to my web site"
task :publish => MIN_GZ do
  sh "rsync -avz . osteele.com:osteele.com/sources/javascript/sequentially --delete --exclude .git --exclude .hg --delete-excluded"
end

desc "minimized"
file MIN => %w[sequentially.js] do |t|
  sh "cat #{t.prerequisites} | ruby ~/src/javascript/jsmin.rb > #{t.name}"
end

desc "minimized, compressed"
file MIN_GZ => MIN do |t|
  sh "gzip < #{t.prerequisites} > #{t.name}"
  puts "#{File.size(t.name)} bytes"
end

desc "experimental doc maker"
task :doc do
  sh "cd ../protodoc && #{RHINO} protodoc.run.js ../sequentially/sequentially.js > ../sequentially/sequentially.api.html"
end
