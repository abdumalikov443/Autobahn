
// Image upload with live preview (based on the FileReader pattern)
$(function () {
    const fileTarget = $(".upload-input");

    fileTarget.on("change", function () {
        if (window.FileReader) {
            const uploadFile = $(this)[0].files[0];
            if (!uploadFile) return;

            const fileType = uploadFile["type"];
            const validImageType = ["image/jpg", "image/jpeg", "image/png"];

            if (!validImageType.includes(fileType)) {
                alert("Please insert only jpeg, jpg and png!");
                return;
            }

            // Show the chosen image FIRST so the user can review it
            $(".upload-img-frame")
                .attr("src", URL.createObjectURL(uploadFile))
                .addClass("success");
            $(".upload-placeholder").hide();
            $(".upload-preview").addClass("has-img");

            // Let the user re-upload if they don't like it
            $(".upload-btn-text").text("Change photo");

            const filename = $(this)[0].files[0].name;
            $(this).closest(".upload-block").find(".upload-name").val(filename);
        }
    });
});


function validateSignupForm() {
    const memberNick = $(".member-nick").val();
    const memberPhone = $(".member-phone").val();
    const memberPassword = $(".member-password").val();

    if (
        memberNick === "" ||
        memberPhone === "" ||
        memberPassword === ""
    ) {
        alert("Please insert all required inputs");
        return false;
    }

    const memberImage = $(".member-image").get(0).files[0] 
        ? $(".member-image").get(0).files[0].name
        : null;
    if (!memberImage) {
        alert("Please insert Admin image");
        return false;
    }
}