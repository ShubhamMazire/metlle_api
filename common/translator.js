const materials = [
    "Aluminum",
    "Carbon Steel",
    "Stainless Steel",
    "Alloy steel",
    "Tool Steel",
    "Copper",
    "Brass",
    "Titanium",
    "super aloy",
];

const material3D = ["PLA", "ABS", "PET-G"];

const colors = ["white", "black"];

const subgrade = [
    [
        "Al 6065-T6",
        "Al 7075-T6",
        "Al 6061",
        "Al6082",
        "Al 6063",
        "AMPCOLOY 45",
        "Al 2014",
    ],
    [
        "1018.0 ",
        "1040.0 ",
        "EN8",
        "A36",
        "EN1A",
        "1045.0 ",
        "IS2062",
        "EN9",
        "EN3B",
        "1010.0 ",
        "1020.0 ",
        "1024.0 ",
        "1527.0 ",
        "1035.0 ",
        "1042.0 ",
        "1080.0 ",
        "129.0 ",
    ],
    [
        "SS304",
        "SS316",
        "SS310",
        "SS304L",
        "SS303",
        "SS316L",
        "SS416",
        "SS420",
        "17-4 PH",
        "SS430",
        "Super duplex",
    ],
    [
        "EN-19/ 4140",
        "EN-24/ 4340",
        "1215.0 ",
        "4145.0 ",
        "8620.0 ",
        "4130.0 ",
        "4150.0 ",
        "4320.0 ",
        "5150.0 ",
        "16MNCR5 ",
        "20MNCR5 ",
        "830006.0 ",
    ],
    ["A1", "A2", "OHNS O1", "OHNS O2", "D2", "D3", "M2", "M42", "W1"],
    ["C110", "C101", "C17200"],
    ["ASTM B16", "C36000", "CZ121", "Navel brass UNS 46400"],
    ["Grade 1", "Grade 2", "Grade 5"],
    [
        "Hstelloy c276",
        "inconel 718",
        "incoloy 925",
        "Inconel 625",
        "Monel 400",
        "Monel 500",
    ],
];

const partFinish = [
    [
        "Bead Blast",
        "Black anodize",
        "Blue anodize",
        "Clear Anodize",
        "Powder coating",
        "Electro plating",
    ],
    [
        "Black oxide",
        "Nickel plating",
        "Powder coating",
        "Silver plating",
        "Through harden",
    ],
    [
        "Black oxide",
        "Nickel plating",
        "Powder coating",
        "Silver plating",
        "Through harden",
    ],
    [
        "Black oxide",
        "Nickel plating",
        "Powder coating",
        "Silver plating",
        "Through harden",
    ],
    [],
    ["Powder coating", "Shot blasting", "Silver plating"],
    ["Powder coating", "Shot blasting", "Silver plating]"],
    [],
    [],
];

const surface_roughness = [3.2, 1.6, 0.8, 0.4];

const certificate = [
    "material test",
    "confirmation",
    "calibration",
];

// eslint-disable-next-line import/no-anonymous-default-export
module.exports = (process, type, value) => {
    switch (process) {


        case "process":
            if (value == "3d") return "3D Printing"
            if (value == "cnc") return "CNC Machining"

        case "threads":
            if (value) return value;
            return "No threads";

        case "certificate":
            return certificate[value];

        case "material":
            return materials[value]
        case "subgrade":
            return subgrade[type][value];
        case "partFinish":
            return partFinish[type][value];
        case "material3D":
            return material3D[value];
        case "colors":
            return colors[value];
        case "surface_roughness":
            return surface_roughness[value];

        case "bounding_box":
            const arr = JSON.parse(value);
            return parseInt(arr[0]) + "x" + parseInt(arr[1]) + "x" + parseInt(arr[2]);

        default:
            return "NA";
    }


    return value;
    //bounding_box
};
