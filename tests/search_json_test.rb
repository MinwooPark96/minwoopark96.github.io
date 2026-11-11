require 'jekyll'
require 'json'
require 'tmpdir'
require 'fileutils'

root = File.expand_path('..', __dir__)

# Build an isolated fixture through Jekyll so filters and URL handling are real.
Dir.mktmpdir('search-json-test-') do |directory|
  source = File.join(directory, 'source')
  destination = File.join(directory, 'output')
  FileUtils.mkdir_p(File.join(source, '_posts'))
  FileUtils.cp(File.join(root, 'search.json'), source)
  title = "Quotes \" & <tag> \\ backslash\t한국어"
  metadata = {
    'title' => title,
    'date' => '2020-01-01',
    'categories' => ['Causal Inference', 'Research'],
    'tags' => ['tag "quoted"', 'path\\name']
  }
  File.write(File.join(source, '_posts', '2020-01-01-fixture.html'),
             metadata.to_yaml + "---\n<p>Body with \\ slash\tand quotes \".</p>\n")

  config = Jekyll.configuration(
    'source' => source, 'destination' => destination,
    'url' => 'https://example.com', 'baseurl' => '/preview',
    'disable_disk_cache' => true, 'quiet' => true
  )
  Jekyll::Site.new(config).process
  entries = JSON.parse(File.read(File.join(destination, 'search.json')))
  raise 'Expected one indexed post' unless entries.length == 1
  entry = entries.first
  raise 'Title did not round-trip' unless entry['title'] == title
  raise 'Optional subtitle is not a string' unless entry['subtitle'] == ''
  raise 'Categories must remain searchable strings' unless entry['categories'] == 'Causal Inference, Research'
  raise 'Tags did not round-trip' unless entry['tags'] == metadata['tags'].join(', ')
  raise 'Base URL was lost' unless entry['url'].start_with?('/preview/')
  raise 'Search fields must all be strings' unless entry.values.all? { |value| value.is_a?(String) }
  raise 'Body was not indexed' unless entry['content'].include?('Body with \\ slash and quotes "')
  puts 'Search JSON regression checks passed.'
end
