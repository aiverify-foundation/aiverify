def walk(f; depth):
  . as $in
  | if type == "object" and depth > 0 then
      reduce keys[] as $key
        ( {}; . + { ($key):  ($in[$key] | walk(f; depth - 1)) } ) | f
  elif type == "array" and depth > 0 then map( walk(f; depth - 1) ) | f
  else f
  end;

def to_tree(depth):
  walk(
    if type == "object" then
      to_entries | map("\(.key)\(if .value == {} then "" elif .value == [] then "[]" else ":" end)") | join(",")
    else .
    end;
    depth
  );

to_tree(3)  # Change 3 to your desired maximum depth
