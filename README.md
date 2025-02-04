Player Management Backend
===
Currently, this is being deployed as an early Alpha state- it is NOT ready for production use of any kind or protecting any sensitive data. There are some security flaws that need to be addressed. This backend also currently uses Microsoft SQL, not a huge fan of it; I will be switching to MySQL when this project gets moved towards production more.

## Layout
I'm setting this up as a pod with three containers in it.
1. The SQL server container
2. The SQL data retrieval node.js container
3. The authentication container (coming later- sql access required first)

Also, the sql access portion needs to be rewritten. It was the first thing I wrote when I was learning about this stuff.