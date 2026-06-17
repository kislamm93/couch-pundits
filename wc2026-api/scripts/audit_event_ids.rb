require "mongo"
require "net/http"
require "json"
require "openssl"

MONGO_URI   = ENV.fetch("MONGODB_URI", "mongodb://localhost:27018")
DB_NAME     = ENV.fetch("DB_NAME", "wc2026")
SPORTSDB_KEY = ENV.fetch("SPORTSDB_KEY", "3")

client = Mongo::Client.new(MONGO_URI, database: DB_NAME, server_selection_timeout: 5)
col    = client[:fixtures]

fixtures = col.find("sportsdb_event_id" => { "$exists" => true })
             .sort("kickoff_utc" => 1)
             .to_a

puts "Checking #{fixtures.size} mapped fixture(s)...\n\n"

bad = []
ok  = []

fixtures.each do |f|
  eid      = f["sportsdb_event_id"]
  our_date = (f["kickoff_utc"] || "")[0, 10]
  teams    = "#{f["home_team"]} v #{f["away_team"]}"
  mid      = f["match_id"]

  uri  = URI("https://www.thesportsdb.com/api/v1/json/#{SPORTSDB_KEY}/lookupevent.php?id=#{eid}")

  fetch = lambda do
    Net::HTTP.start(uri.host, uri.port, use_ssl: true, verify_mode: OpenSSL::SSL::VERIFY_NONE) { |h| h.get(uri.request_uri) }.body
  end

  event = nil
  2.times do |attempt|
    body = fetch.call
    begin
      event = JSON.parse(body).dig("events", 0)
      break
    rescue JSON::ParserError
      if attempt == 0
        puts "\n  RATE LIMITED at match_id=#{mid} — waiting 90s..."
        sleep 90
      else
        puts "  STILL RATE LIMITED at match_id=#{mid} — stopping early. Re-run later."
        puts "\n--- PARTIAL RESULTS (stopped at match_id=#{mid}) ---"
        puts "OK so far:  #{ok.size}"
        puts "BAD so far: #{bad.size}"
        bad.each { |b| puts "  match_id=#{b[:mid]}  #{b[:teams]}  (expected #{b[:our_date]}, event #{b[:eid]} is #{b[:feed_date]})" }
        client.close
        exit 1
      end
    end
  end

  unless event
    puts "  NOT FOUND  match_id=#{mid}  #{teams}  (event #{eid} missing from TheSportsDB)"
    bad << { mid: mid, teams: teams, our_date: our_date, eid: eid, feed_date: "NOT FOUND" }
    sleep 5
    next
  end

  feed_date   = event["dateEvent"] || ""
  feed_score  = "#{event["intHomeScore"]}-#{event["intAwayScore"]}"
  feed_status = event["strStatus"] || "?"

  if feed_date != our_date
    puts "  BAD   match_id=#{mid.to_s.rjust(2)}  #{teams.ljust(30)}  our=#{our_date}  feed=#{feed_date}  id=#{eid}  #{feed_score} [#{feed_status}]"
    bad << { mid: mid, teams: teams, our_date: our_date, eid: eid, feed_date: feed_date }
  else
    puts "  OK    match_id=#{mid.to_s.rjust(2)}  #{teams.ljust(30)}  #{our_date}  id=#{eid}  #{feed_score} [#{feed_status}]"
    ok << mid
  end

  sleep 5
end

puts "\n--- SUMMARY ---"
puts "OK:  #{ok.size}"
puts "BAD: #{bad.size}"

if bad.any?
  puts "\nFixtures needing attention:"
  bad.each do |b|
    puts "  match_id=#{b[:mid]}  #{b[:teams]}  (expected #{b[:our_date]}, event #{b[:eid]} is #{b[:feed_date]})"
  end
  puts "\nFor each bad match_id, run in mongosh:"
  bad.each do |b|
    puts "  db.fixtures.updateOne({ match_id: #{b[:mid]} }, { $unset: { sportsdb_event_id: \"\" } })"
  end
end

client.close
