import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.2/firebase-app.js";

import * as rtdb from "https://www.gstatic.com/firebasejs/9.0.2/firebase-database.js";

import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.0.2/firebase-analytics.js";

import * as fbauth from "https://www.gstatic.com/firebasejs/9.0.2/firebase-auth.js";


const firebaseConfig = {
    apiKey: "AIzaSyCE7kHMUorKNQvwIYLk6S5vh_1ViUNhZuY",
    authDomain: "ggkjcg-70cec.firebaseapp.com",
    databaseURL: "https://ggkjcg-70cec-default-rtdb.firebaseio.com",
    projectId: "ggkjcg-70cec",
    storageBucket: "ggkjcg-70cec.appspot.com",
    messagingSenderId: "843696137944",
    appId: "1:843696137944:web:94319abba744a75ffc19ad"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);


const db = rtdb.getDatabase(app);
const chatRef = rtdb.ref(db, "/chats");
//For Users Ref
const userRef = rtdb.ref(db, "/users");
const auth = fbauth.getAuth(app);

/* #######################    Send Messages Functions   ####################### */

// Used to send messages to the rtdb
function sendMessage() {
    // send message
    var message = $("#messageBox").val();
    var type = $("#MessageType").val();
    //Checking the type of message that it is edit or new
    if (type == "2") {
        var Id = $("#EditId").val();
        var messageInfo = {};
        messageInfo.message = message;
        rtdb.update(rtdb.ref(db, "/chats/" + Id), messageInfo);
        $("#messageBox").val("");
        $("#MessageType").val("1");
        $("#EditId").val("")
    }
    else {
        var user = auth.currentUser;
        var messageInfo = {};
        messageInfo.message = message;
        messageInfo.userId = $('#CurrentUserId').val();
        messageInfo.username = $('#CurrentUsername').val();
        rtdb.push(chatRef, messageInfo);
        $("#messageBox").val(""); //set element value to empty
    }
}

/* #######################    Auth Functions   ####################### */

fbauth.onAuthStateChanged(auth, (user) => {
    if (!!user) {
        
        // check to see if there is a user
        $(".login-wrapper").hide(); // hide login and register button
        $(".logoutUser").show(); // show logout button
        $(".chatSection").show(); // show chat area
        $("#loggedIn").html("Logged in as: " + user.email);
        //renderUser(user);
        // show who is logged in
        $('#CurrentUserId').val(user.uid);
        //Getting the role of user
        rtdb.onValue(rtdb.ref(db, "/users/" + user.uid), (snapshot) => {
            if (snapshot) {
                var data = snapshot.val();
                $('#CurrentUsername').val(data.username);
                if (data.roles.user == true) {
                    $("#loggedIn").append("   (Role: User)");
                    $('#Role').val("User");
                }
                else if (data.roles.admin == true) {
                    $("#loggedIn").append("   (Role: Admin)");
                    $('#Role').val("Admin");
                }
            }
            //Getting the chats
            rtdb.onValue(chatRef, (ss) => {
                let puch = ss.val();
                if (puch == null) {
                    puch = "";
                }
                let keys = Object.keys(puch);
                $("#chatLog").html("");
                keys.map((pass) => {
                    var userId = $('#CurrentUserId').val();
                    var role = $('#Role').val();
                    //Checking the message is of current user or current user is admin
                    if (userId == puch[pass].userId || role == "Admin") {
                        var Deletebutton = `<button data-id="${pass}" class='btn btn-danger delete'>Delete Message </button>`;
                        var Editbutton = `<button data-id="${pass}" data-message="${puch[pass].message}" class='btn btn-primary edit'">Edit Message </button>`;
                    }
                    else {
                        var Deletebutton = "";
                        var Editbutton = "";
                    }
                    //Checking the role of the message user
                    rtdb.onValue(rtdb.ref(db, "/users/" + puch[pass].userId), (snapshot) => {
                        if (snapshot) {
                            var data = snapshot.val();
                            if (data.roles.user == true) {
                                $("#chatLog").append(`<li>${puch[pass].message} ( ${puch[pass].username} ) (User) ${Deletebutton} ${Editbutton}</li>`);
                            }
                            else if (data.roles.admin == true) {
                                $("#chatLog").append(`<li>${puch[pass].message} ( ${puch[pass].username} ) (Admin) ${Deletebutton} ${Editbutton}</li>`);
                            }
                        }
                    })
                });
                //Delete function for chats
                $(".delete").click(function () {
                    var Id = $(this).attr('data-id');
                    rtdb.remove(rtdb.ref(db, "/chats/" + Id));
                });
                //Edit function for chats message
                $(".edit").click(function () {
                    var Id = $(this).attr('data-id');
                    var message = $(this).attr('data-message');
                    $('#MessageType').val("2");
                    $('#EditId').val(Id);
                    $('#messageBox').val(message);
                });
            });
        })
        //Get Users If current User is admin
        rtdb.onValue(userRef, (ss) => {
            let puch = ss.val();
            if (puch == null) {
                puch = "";
            }
            var role = $('#Role').val();
            let keys = Object.keys(puch);
            $("#userLog").html("");
            keys.map((pass) => {
                var Editbutton = `<button style="margin-left:12px;" data-id="${pass}" class='btn btn-primary edit2'">Make Admin </button>`;
                if (puch[pass].roles.user == true) {
                    $("#userLog").append(`<li>${puch[pass].username} ( ${puch[pass].email} ) (User) ${Editbutton}</li>`);
                }
                if (puch[pass].roles.admin == true) {
                    $("#userLog").append(`<li>${puch[pass].username} ( ${puch[pass].email} ) (Admin)</li>`);
                }
            });
            //Make other user admin
            $(".edit2").click(function () {
                var Id = $(this).attr('data-id');
                var roles = {};
                roles.admin = true;
                rtdb.set(rtdb.ref(db, "/users/" + Id + "/roles/"), roles);
            });
        });
        $("#logoutButton").on("click", () => {
            fbauth.signOut(auth);
            $(".logoutUser").hide();
            $(".chatSection").hide(); // show chat area
            $(".login-wrapper").show();
        });
    } else {
        $(".login-wrapper").show();
        $(".logoutUser").hide();
        $(".chatSection").hide();
    }
});

/* #######################    Rendering Functions   ####################### */



/* #######################    Binding Functions   ####################### */
$("#submitButton").click(sendMessage); // bind listener to send message with click
//Clear Chats history
$("#clearChats").click(function () {
    var userId = $('#CurrentUserId').val();

})
$("#register").click(function () {
    // bind listener to register message with
    //this method give me error 
    /* const email= document.getElementById("regEmail"); 
     const regPass = document.getElementById("regPass"); 
     const confPass = document.getElementById("confPass");
     const deleteBtn = document.getElementById("delete-btn");//do it later
     const username = document.getElementById("usernameReg");*/
    var email = $("#regEmail").val();
    var p1 = $("#regPass").val();
    var p2 = $("#confPass").val();
    var username = $("#usernameReg").val();
    if (p1 != p2) {
        alert("Passwords do not match");
        //clear boxes 
        email.value = "";
        username.value = "";
        p1.value = "";
        p2.value = "";

        /* $("#regEmail").val("");
         $("#usernameReg").val("");
         $("#regPass").val("");
         $("#confPass").val("");
         return;*/
    }
    fbauth.createUserWithEmailAndPassword(auth, email, p2)
        .then((somedata) => {

            var uid = somedata.user.uid;
            // refs section
            var userRoleRef = rtdb.ref(db, `/users/${uid}/roles/user`);
            var userEmailRef = rtdb.ref(db, `users/${uid}/email`);
            var usernameRef = rtdb.ref(db, `users/${uid}/username`);

            //  var useradminRef=rtdb.ref(db, `users/${uid}/admin`)

            // setting infromation
            rtdb.set(userRoleRef, true); // user only accounts (not admin, mod or owner)
            rtdb.set(usernameRef, username); // set username up for user
            rtdb.set(userEmailRef, email); // set useraccount to email in case
            $('#CurrentUserId').val(uid);
            $('#CurrentUsername').val(username);
            //clearbox
            $("#regEmail").val("");
            $("#usernameReg").val("");
            $("#regPass").val("");
            $("#confPass").val("");

        })



        .catch(function (error) {
            // Handle Errors here.
            var errorCode = error.code;
            var errorMessage = error.message;

            alert(errorMessage); //notify user
            console.log(errorCode);
            console.log(errorMessage);
        });
});

// used to sign into FB
$("#loginButton").click(function () {
    let email = $("#loginEmail").val();
    let pwd = $("#loginPass").val();
    fbauth.signInWithEmailAndPassword(auth, email, pwd)
        .then((somedata) => {
            console.log(somedata);
            $("#loginEmail").val("");
            $("#loginPass").val("");
        })


        .catch(function (error) {
            // Handle Errors here.
            var errorCode = error.code;
            var errorMessage = error.message;
            alert(errorMessage); // notfiy user
            console.log(errorCode);
            console.log(errorMessage);
        });
});



