// --- CONSTANTS ---
const BADGE_SUCCESS_CLASS = "bg-success";
const BADGE_DANGER_CLASS = "bg-danger";
const N_A = 'N/A';

// --- DISPLAY CONFIGURATION ---
const displayConfig = {
    "summaryFields": [
        "Gene",
        "c.",
        "p.",
        "Has functional study?",
        "FH VCEP Classification",
        "Curated by FH VCEP?"
    ].map(key => ({ key: key, label: key })),
    "hiddenFields": [
        "Location",
        "Variant type",
        "Allele type",
        "ClinVar ID",
        "ClinGen Allele Registry ID",
        "FH VCEP evidence codes",
        "Guideline version",
        "Date of classification",
        "Curated by"
    ],
    "studyFields": {
        "type": "Type of functional study (sample type, assay)",
        "result": "Result of functional study",
        "author": "Authors",
        "pmid": "PMID"
    },
    "acmgHighlighting": {
        "pathogenic": "acmg-pathogenic",
        "likely pathogenic": "acmg-likely-pathogenic",
        "vus": "acmg-vus",
        "likely benign": "acmg-likely-benign",
        "benign": "acmg-benign",
        "conflicting": "acmg-conflicting"
    },
    "tooltips": {
        "variant code": "variant code",
        "Gene": "Reference sequences used were: APOB: NM_000384.3, LDLR: NM_000527.5, PCSK9: NM_174936.4",
        "c.": "Variant at the DNA level",
        "p.": "Variant at protein level",
        "Has functional study?": "Yes - published functional study. Under review - please check back later, as information is being updated. Ongoing - Variant is currently being studied functionally, please come back later for updates.",
        "FH VCEP Classification": "Variant classification according to the latest approved ACMG guidelines, with specifications for each gene by the ClinGen FH Variant Curation Expert Panel (More details here: https://clinicalgenome.org/affiliation/50004/)",
        "Curated by FH VCEP?": "If the variant was classified by the ClinGen FH VCEP (https://clinicalgenome.org/affiliation/50004/)",
        "Location": "Location in the gene - exon, intron, 5'UTR, 3'UTR, promoter",
        "Variant type": "Variant type - missense, nonsense, frameshift, synonymous, in frame, large deletions or duplications (CNVs)",
        "Allele type": "If the variant has a functional study: Null = variants that confer less than 10% of wild-type activity in either step of LDLR cycle (expression, binding or uptake); Defective = variants that confer between 10% and 70% of wild-type activity in either step of LDLR cycle (expression, binding or uptake), different thresholds are used for luciferase assays; Normal: variant that confers more than 90% of wild-type activity in all steps of LDLR cycle (expression, binding and uptake). NTD: not possible to determine, for example: Variants that affect splicing cannot be assigned either Null or Defective unless the LDLR cycle has also been studied. Results from heterozgyous patient cells should be interpreted with care.",
        "ClinVar ID": "Link to ClinVar database for this variant",
        "ClinGen Allele Registry ID": "Link to ClinGen Allele Registry database for this variant",
        "FH VCEP evidence codes": "Evidence codes met to reach the ACMG classification of this variant (More details here: https://clinicalgenome.org/affiliation/50004/)",
        "Date of classification": "Variant classifications are always linked to a date of classification. Newer evidence should be evaluated when reporting this variant",
        "Curated by": "Who has classified this variant: FH VCEP - FH Variant Curation Expert Panel. PerMedFH - not yet classified at the FH VCEP level, rather classified by the investigators of the PerMedFH project",
        "studied in PerMedFH?": "Variant studied as part of the PerMedFH project. Please see specific workpackage page for details",
        "Type of functional study (sample type, assay)": "What type of functional study was performed, which was the sample (heterologous or patient cells) and which assay was used",
        "Result of functional study": "Result of the functional study - which percentage of wild-type activity does the variant retain",
        "Authors": "Authors of the publication",
        "PMID": "Publication detailing the functional studies performed"
    }
};
const searchConfig = { searchableFields: ['c.', 'p.'] };

// --- Global variable to hold the fetched data ---
let geneData = {};

$(document).ready(function() {
    // --- 1. FETCH DATA AND INITIALIZE ---
    console.log("Fetching variant data...");
    fetch('data.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Data fetched successfully. Initializing application.");
            geneData = data;
            const $geneSelector = $('#gene-selector');
            const $variantForm = $('#variant-form');
            const $variantInput = $('#variant-input');
            
            const genes = Object.keys(geneData).sort();
            $geneSelector.empty(); // Clear any previous options
            genes.forEach(gene => {
                $geneSelector.append(new Option(gene, gene));
            });

            $geneSelector.select2({ theme: "bootstrap-5", width: '100%' });
            $('body').tooltip({ selector: '[data-bs-toggle="tooltip"]' });

            $variantForm.on('submit', function(e) {
                e.preventDefault();
                searchAndDisplay($geneSelector.val(), $variantInput.val());
            });

            $('#results-container').on('click', '.results-summary', function() {
                $(this).siblings('.results-details').slideToggle('fast');
                $(this).find('.toggle-icon').toggleClass('expanded');
            });
            console.log("Application initialized.");
        })
        .catch(error => {
            console.error("Fatal Error: Could not fetch or parse data.json.", error);
            displayError("Could not load variant data. Please check that 'data.json' exists and is correctly formatted.");
        });
});

/**
 * A generator function to search for a variant within a gene.
 * It yields the first matching variant found.
 * @param {string} gene - The gene to search within.
 * @param {string} searchTerm - The search term (variant ID).
 * @yields {object|null} The matching variant object or null if not found.
 */
function* searchGenerator(gene, searchTerm) {
    const geneInfo = geneData[gene];
    if (!geneInfo) { yield null; return; }
    for (const variant of geneInfo.variants) {
        for (const field of searchConfig.searchableFields) {
            const value = variant[field];
            if (value && String(value).toLowerCase() === searchTerm) {
                yield variant;
                return;
            }
        }
    }
    yield null;
}

/**
 * Searches for a variant within a specified gene and displays its data.
 * @param {string} gene - The gene to search within.
 * @param {string} variantId - The ID of the variant to search for.
 */
function searchAndDisplay(gene, variantId) {
    const searchTerm = variantId.trim().toLowerCase();
    const searchResult = searchGenerator(gene, searchTerm).next().value;
    if (searchResult) {
        searchResult.Gene = gene; // Add the gene name to the variant object
        displayVariantData(searchResult);
    } else {
        displayNotFound(`Variant '${variantId}' was not found in gene ${gene}.`);
    }
}

/**
 * Displays the variant data in the results container.
 * @param {object} variant - The variant object to display.
 */
function displayVariantData(variant) {
    const summaryHtml = _generateSummaryHtml(variant);
    const hiddenDetailsHtml = _generateHiddenDetailsHtml(variant);
    const studiesTableHtml = generateStudiesTable(variant);

    const html = `
        <div class="card shadow-sm results-card">
            <div class="card-body p-0">
                <div class="d-flex justify-content-between align-items-center p-3 results-summary" style="cursor: pointer;" title="Click to expand/collapse">
                    <div class="d-flex flex-wrap align-items-center summary-container">${summaryHtml}</div>
                    <div class="text-end"><span class="toggle-icon ms-3">▼</span></div>
                </div>
                <div class="results-details p-3 border-top" style="display: none;">
                    <h5 class="mb-3">Full Variant Details</h5>
                    <dl class="row variant-details-list">${hiddenDetailsHtml}</dl>
                    <hr>
                    ${studiesTableHtml}
                </div>
            </div>
        </div>`;
    $('#results-container').html(html);
}

/**
 * Generates the HTML for the summary section of a variant.
 * @param {object} variant - The variant object.
 * @returns {string} The HTML string for the summary section.
 */
function _generateSummaryHtml(variant) {
    return displayConfig.summaryFields.map(field => {
        const value = variant[field.key] || N_A;
        const tooltip = displayConfig.tooltips[field.key] || '';
        let valueHtml = `<strong>${field.label}:</strong> ${value}`;

        if (field.key === "FH VCEP Classification") {
            const acmgClass = getAcmgHighlightClass(value);
            valueHtml = `<strong>${field.label}:</strong> <span class="badge ${acmgClass}">${value}</span>`;
        } else if (field.key === "Curated by FH VCEP?") {
            const vcepValue = variant[field.key];
            if (vcepValue) {
                const vcepValueLower = String(vcepValue).toLowerCase();
                const badgeClass = vcepValueLower === 'yes' ? BADGE_SUCCESS_CLASS : BADGE_DANGER_CLASS;
                valueHtml = `<strong>${field.label}:</strong> <span class="badge ${badgeClass}">${vcepValue}</span>`;
            }
        }
        return `<div class="summary-item" data-bs-toggle="tooltip" title="${tooltip}">${valueHtml}</div>`;
    }).join('');
}

/**
 * Generates the HTML for the hidden details section of a variant.
 * @param {object} variant - The variant object.
 * @returns {string} The HTML string for the hidden details section.
 */
function _generateHiddenDetailsHtml(variant) {
    let html = displayConfig.hiddenFields.map(key => {
        const tooltip = displayConfig.tooltips[key] || '';
        if (key === "Curated by FH VCEP?") {
            const vcepValue = variant[key];
            if (!vcepValue) return '';
            const vcepValueLower = String(vcepValue).toLowerCase();
            const badgeClass = vcepValueLower === 'yes' ? BADGE_SUCCESS_CLASS : BADGE_DANGER_CLASS;
            return generateFieldHtml(key, vcepValue, tooltip, badgeClass);
        } else if (key === "ClinVar ID" && variant[key]) {
            return generateFieldHtml(key, `<a href="https://www.ncbi.nlm.nih.gov/clinvar/variation/${variant[key]}/" target="_blank">${variant[key]}</a>`, tooltip);
        } else if (key === "ClinGen Allele Registry ID" && variant[key]) {
            return generateFieldHtml(key, `<a href="https://reg.clinicalgenome.org/redmine/projects/registry/genboree_registry/by_canonicalid?canonicalid=${variant[key]}" target="_blank">${variant[key]}</a>`, tooltip);
        } else if (key === "Guideline version" && variant[key]) {
            const link = variant["link"] || "#"; // Assuming 'link' column holds the URL
            return generateFieldHtml(key, `<a href="${link}" target="_blank">${variant[key]}</a>`, tooltip);
        }
        return generateFieldHtml(key, variant[key], tooltip);
    }).join('');

    // Handle "studied in PerMedFH?" as an image
    if (variant["studied in PerMedFH?"] && String(variant["studied in PerMedFH?"]).toLowerCase() === 'yes') {
        html += generateFieldHtml("Studied in PerMedFH?", '<img src="placeholder.png" alt="Studied in PerMedFH" style="width: 50px; height: 50px;"> ', displayConfig.tooltips["studied in PerMedFH?"]);
    }
    return html;
}

function getAcmgHighlightClass(acmgValue) {
    if (!acmgValue) return 'bg-secondary';
    const lowerAcmgValue = acmgValue.toLowerCase();
    for (const key in displayConfig.acmgHighlighting) {
        if (lowerAcmgValue.includes(key)) return displayConfig.acmgHighlighting[key];
    }
    return 'bg-secondary';
}

/**
 * Generates the HTML for a single field (label and value).
 * @param {string} label - The label for the field.
 * @param {string} value - The value of the field.
 * @param {string} tooltipText - The tooltip text for the field.
 * @param {string} [badgeClass] - Optional CSS class for a badge if the value should be displayed as a badge.
 * @returns {string} The HTML string for the field.
 */
function generateFieldHtml(label, value, tooltipText, badgeClass) {
    const tooltip = tooltipText ? `data-bs-toggle="tooltip" data-bs-placement="top" title="${tooltipText}"` : "";
    let displayValue = value || N_A;
    if (badgeClass) {
        displayValue = `<span class="badge ${badgeClass}">${value}</span>`;
    }
    return `<dt class="col-sm-4" ${tooltip}>${label}</dt><dd class="col-sm-8">${displayValue}</dd>`;
}

/**
 * Generates the HTML table for functional studies.
 * @param {object} variant - The variant object containing study data.
 * @returns {string} The HTML string for the studies table.
 */
function generateStudiesTable(variant) {
    const studies = [];
    let i = 1;
    const typeKeyBase = displayConfig.studyFields.type;
    while (variant[`${typeKeyBase}${i}`]) {
        const study = {};
        for (const key in displayConfig.studyFields) {
            study[key] = variant[displayConfig.studyFields[key] + i];
        }
        studies.push(study);
        i++;
    }

    if (studies.length === 0) return '<p class="text-muted mt-4">No functional studies available.</p>';

    const header = `<thead><tr><th>${displayConfig.studyFields.type}</th><th>${displayConfig.studyFields.result}</th><th>Publication</th></tr></thead>`;
    const rows = studies.map(s => {
        const link = s.pmid ? `<a href="https://pubmed.ncbi.nlm.nih.gov/${s.pmid}/" target="_blank">${s.author || 'Link'}</a>` : 'N/A';
        return `<tr><td>${s.type || 'N/A'}</td><td>${s.result || 'N/A'}</td><td>${link}</td></tr>`;
    }).join('');

    return `<h5 class="mt-4">Functional Studies</h5><div class="table-responsive"><table class="table table-bordered">${header}<tbody>${rows}</tbody></table></div>`;
}

/**
 * Displays a "not found" message in the results container.
 * @param {string} message - The message to display.
 */
function displayNotFound(message) { $('#results-container').html(`<div class="alert alert-warning">${message}</div>`); }

/**
 * Displays an error message in the results container.
 * @param {string} message - The message to display.
 */
function displayError(message) { $('#results-container').html(`<div class="alert alert-danger">${message}</div>`); }
