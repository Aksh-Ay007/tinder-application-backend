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
             POST/request/review/:status/:requestId


[POST/request/review/accepted/:requestId
POST/request/review/rejected/:requestId]=>>>>>>>>>>>>>>>>>>instead both we can use          POST/request/review/:status/:requestId
  this api





              //user Router


               GET/user/requests/recieved
               GET/user/connetions  ----------------who is acceped req
              GET/user/feed...get you theprofile of otheruser on platform




Status:ignore,intrested,accepted,rejected