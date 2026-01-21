const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRVGSYyB085ckBA2ERYOtvW4FLNEXoywt1ovE6r7xPQswoS6ExJlPEZ-eQ_S7EscWUjXWyodPz1ZSPR/pub?output=csv";

function parseDateSafe(dateStr){
    if(!dateStr) return null;
    dateStr = dateStr.trim();

    if(dateStr.includes("-")){
        const p = dateStr.split("-");
        if(p[0].length === 4){
            const d = new Date(`${p[0]}-${p[1]}-${p[2]}`);
            return isNaN(d) ? null : d;
        }
    }

    if(dateStr.includes("/")){
        const p = dateStr.split("/");
        if(p[2] && p[2].length === 4){
            const d = new Date(`${p[2]}-${p[1]}-${p[0]}`);
            return isNaN(d) ? null : d;
        }
    }

    const d = new Date(dateStr);
    return isNaN(d) ? null : d;
}

function formatDate(dateStr){
    const d = parseDateSafe(dateStr);
    if(!d) return dateStr;

    const months = [
        "January","February","March","April","May","June",
        "July","August","September","October","November","December"
    ];

    const day = String(d.getDate()).padStart(2,"0");
    const month = months[d.getMonth()];
    const year = d.getFullYear();

    return `${day} ${month} ${year}`;
}

function handleEnter(e){
    if(e.key === "Enter"){
        checkPayment();
    }
}

async function checkPayment(){

    const input = document.getElementById("searchInput").value.trim().toLowerCase();
    const resultBox = document.getElementById("result");

    if(input === ""){
        resultBox.innerHTML = "⚠️ নাম বা মোবাইল নাম্বার লিখুন";
        return;
    }

    try{
        const res = await fetch(sheetURL);
        const csv = await res.text();
        const rows = csv.split("\n").slice(1);

        let personName = "";
        let mobile = "";
        let totalAmount = null;  
        let totalPaid = 0;

        let monthlyPaid = {};
        let paymentHistory = "";
        let found = false;

        rows.forEach(row => {

            if(row.trim() === "") return;

            const cols = row.split(",");

            const rName   = cols[0]?.trim();
            const rMobile = cols[1]?.trim();
            const total   = Number(cols[2]);
            const paid    = Number(cols[3]);
            const dateStr = cols[4]?.trim();

            if(
                input === rName.toLowerCase() ||
                input === rMobile
            ){
                found = true;

                personName = rName;
                mobile = rMobile;

             
                if(totalAmount === null){
                    totalAmount = total;
                }

              
                totalPaid += paid;

                const d = parseDateSafe(dateStr);
                if(d){
                    const key = d.toLocaleString("en-US", {
                        month: "long",
                        year: "numeric"
                    });
                    monthlyPaid[key] = (monthlyPaid[key] || 0) + paid;
                }

                paymentHistory +=
                    `💸 ₹${paid} — ${formatDate(dateStr)}<br>`;
            }
        });

        if(!found){
            resultBox.innerHTML = "❌ কোনো তথ্য পাওয়া যায়নি";
            return;
        }

        let due = totalAmount - totalPaid;
        let extraHTML = "";

        if(due < 0){
            extraHTML = `💚 <b>Extra Paid: ₹${Math.abs(due)}</b><br>`;
            due = 0;
        }

        let monthHTML = "";
        for(let m in monthlyPaid){
            monthHTML += `📅 <b>${m}</b>: ₹${monthlyPaid[m]}<br>`;
        }

        resultBox.innerHTML = `
            👤 নাম: <b>${personName.toUpperCase()}</b><br>
            📱 মোবাইল: ${mobile}<br><br>

            💰 মোট টাকা: ₹${totalAmount}<br>
            ✅ <b>মোট দিয়েছে: ₹${totalPaid}</b><br>
            ${extraHTML}
            ❌ বাকি আছে: ₹${due}<br><br>

            <b>🧾 Payment History:</b><br>
            ${paymentHistory}<br>
        `;

    }catch(err){
        resultBox.innerHTML = "⚠️ Google Sheet load হয়নি";
        console.error(err);
    }
}
