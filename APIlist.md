//api lists used in this project

##Auth router

POST/auth/signup
POST/auth/login
POST/auth/logout




##Profile router

GET/profile/view
PATCH/profile/edit.............update profile
PATCH/profile/patchPassword....update password



##sending a connection request

 //Connection router
POST/request/send/:status/:userId
POST/request/send/:status/:requestId



##connection  reqest Router

POST/request/review/accepted/:requestId
POST/request/review/rejected/:requestId


//user router

GET/user/connetions
GET/user/reqests/reveived
GET/user/feed...get you theprofile of otheruser on platform




Status:ignore,intrested,accepted,rejected