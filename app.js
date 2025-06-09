// This is your updated data source.
// Note the new `p_notation` and `aliases` fields within each variant object.
const geneData = {
    "LDLR": {
        "fullName": "Low Density Lipoprotein Receptor",
        "chromosome": "19p13.2",
        "summary": "Encodes the receptor for low-density lipoprotein (LDL), which is responsible for clearing LDL ('bad cholesterol') from the bloodstream. Mutations cause Familial Hypercholesterolemia (FH).",
        "variants": [
            {
                "id": "rs121908028",
                "hgvs": "c.1060+10G>A",
                "p_notation": "p.(?)", // Splicing variant, protein effect is complex
                "aliases": ["FH-Toulouse"],
                "location": "chr19:11223940-11223940",
                "variantType": "SNV",
                "clinvarId": "12345",
                "clinicalSignificance": "Pathogenic",
                "fhVcepEvidenceCodes": "PS3, PM2, PP4",
                "classificationDate": "2023-05-18",
                "isFhVcepCurated": true,
                "functionalStudies": [
                    {
                        "studyType": "Splicing Assay",
                        "result": "Leads to exon 7 skipping, resulting in a truncated, non-functional protein.",
                        "author": "Sun",
                        "year": 2021,
                        "pubmedId": "33998810",
                        "isHighlighted": true
                    }
                ]
            },
            {
                "id": "rs28942082",
                "hgvs": "c.1774G>A",
                "p_notation": "p.Cys592Tyr",
                "aliases": [],
                "location": "chr19:11234567-11234567",
                "variantType": "SNV",
                "clinvarId": "67890",
                "clinicalSignificance": "Benign",
                "fhVcepEvidenceCodes": "BA1, BS2",
                "classificationDate": "2022-11-01",
                "isFhVcepCurated": true,
                "functionalStudies": []
            }
        ]
    },
    "BRCA1": {
        "fullName": "Breast Cancer Gene 1",
        "chromosome": "17q21.31",
        "summary": "Associated with hereditary breast and ovarian cancer. Mutations significantly increase the risk of developing these cancers.",
        "variants": [
            {
                "id": "185delAG",
                "hgvs": "c.68_69delAG",
                "p_notation": "p.Gln23fs",
                "aliases": ["HBOC_Founder_1"],
                "location": "chr17:43125342-43125343",
                "variantType": "Indel",
                "clinvarId": "9342",
                "clinicalSignificance": "Pathogenic",
                "fhVcepEvidenceCodes": "N/A",
                "classificationDate": "2021-01-15",
                "isFhVcepCurated": false,
                "functionalStudies": [
                    {
                        "studyType": "Protein Truncation Test",
                        "result": "Confirms the production of a truncated protein.",
                        "author": "Friedman",
                        "year": 1994,
                        "pubmedId": "7989345",
                        "isHighlighted": true
                    }
                ]
            }
        ]
    }
};


$(document).ready(function() {
    // --- 1. INITIALIZATION (No changes here) ---
    const $geneSelector = $('#gene-selector');
    const $variantForm = $('#variant-form');
    const $variantInput = $('#variant-input');
    const $resultsContainer = $('#results-container');
    
    const genes = Object.keys(geneData).sort();
    genes.forEach(gene => {
        $geneSelector.append(new Option(gene, gene));
    });

    $geneSelector.select2({
        theme: "bootstrap-5",
        width: '100%',
    });

    // --- 2. EVENT HANDLING (No changes here) ---
    $variantForm.on('submit', function(e) {
        e.preventDefault(); 
        const selectedGene = $geneSelector.val();
        const variantId = $variantInput.val(); // We trim and normalize in the search function

        if (!selectedGene || !variantId) {
            displayError("Please select a gene and enter a variant ID.");
            return;
        }
        searchAndDisplay(selectedGene, variantId);
    });

    // --- 3. CORE FUNCTIONS (Search logic updated) ---
    function searchAndDisplay(gene, variantId) {
        const geneInfo = geneData[gene];
        if (!geneInfo) {
            displayNotFound("Gene not found in the database.");
            return;
        }

        // Normalize the search term for a robust, case-insensitive search
        const searchTerm = variantId.trim().toLowerCase();

        // **NEW: Multi-field search logic**
        const foundVariant = geneInfo.variants.find(variant => {
            const idMatch = variant.id?.toLowerCase() === searchTerm;
            const hgvsMatch = variant.hgvs?.toLowerCase() === searchTerm;
            const pNotationMatch = variant.p_notation?.toLowerCase() === searchTerm;
            const aliasMatch = variant.aliases?.some(alias => alias.toLowerCase() === searchTerm);

            return idMatch || hgvsMatch || pNotationMatch || aliasMatch;
        });
        
        if (foundVariant) {
            displayVariantData(foundVariant, geneInfo);
        } else {
            displayNotFound(`Variant '${variantId}' was not found for gene ${gene}.`);
        }
    }
    
    // --- 4. DISPLAY FUNCTIONS (Minor update to show p. notation) ---
    function generateStudiesTable(studies) {
        if (!studies || studies.length === 0) {
            return '<p class="text-muted mt-4">No functional studies available for this variant.</p>';
        }
        const tableHeader = `...`; // Same as before, omitted for brevity
        const tableRows = studies.map(study => {
            // ... same as before
        }).join('');
        // This function's internal logic is unchanged from the previous version.
        // Full implementation is in the previous response if needed.
        return `...`;
    }
    
    function displayVariantData(variant, gene) {
        const significanceClass = getSignificanceClass(variant.clinicalSignificance);
        const vcepCurationBadge = variant.isFhVcepCurated 
            ? '<span class="badge bg-success">Yes</span>'
            : '<span class="badge bg-secondary">No</span>';

        const clinvarLink = variant.clinvarId 
            ? `<a href="https://www.ncbi.nlm.nih.gov/clinvar/variation/${variant.clinvarId}/" target="_blank">${variant.clinvarId}</a>`
            : 'N/A';

        const studiesTableHtml = generateStudiesTable(variant.functionalStudies); // Function defined in previous response

        const html = `
            <div class="card shadow-sm results-card">
                <div class="card-header bg-white d-flex justify-content-between align-items-center">
                    <h3 class="mb-0">${variant.id} <small class="text-muted">in ${Object.keys(geneData).find(key => geneData[key] === gene)}</small></h3>
                    <span class="badge ${significanceClass} fs-6">${variant.clinicalSignificance || 'Unknown'}</span>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-12">
                            <h5>Variant Details</h5>
                            <dl class="row variant-details-list">
                                <dt class="col-sm-3">Location</dt>
                                <dd class="col-sm-9">${variant.location || 'N/A'}</dd>
                                
                                <dt class="col-sm-3">HGVS (DNA)</dt>
                                <dd class="col-sm-9"><code>${variant.hgvs || 'N/A'}</code></dd>
                                
                                <!-- **NEW: Displaying Protein Notation** -->
                                <dt class="col-sm-3">HGVS (Protein)</dt>
                                <dd class="col-sm-9"><code>${variant.p_notation || 'N/A'}</code></dd>
                                
                                <dt class="col-sm-3">Variant Type</dt>
                                <dd class="col-sm-9">${variant.variantType || 'N/A'}</dd>

                                <dt class="col-sm-3">ClinVar ID</dt>
                                <dd class="col-sm-9">${clinvarLink}</dd>

                                <dt class="col-sm-3">FH VCEP Evidence</dt>
                                <dd class="col-sm-9">${variant.fhVcepEvidenceCodes || 'N/A'}</dd>

                                <dt class="col-sm-3">Curated by FH VCEP</dt>
                                <dd class="col-sm-9">${vcepCurationBadge}</dd>

                                <dt class="col-sm-3">Date of Classification</dt>
                                <dd class="col-sm-9">${variant.classificationDate || 'N/A'}</dd>
                            </dl>
                        </div>
                    </div>
                    <hr>
                    ${studiesTableHtml}
                    <hr>
                    <h5>Gene Context: ${gene.fullName}</h5>
                    <p class="text-muted">${gene.summary || 'No summary available.'}</p>
                </div>
            </div>
        `;
        $resultsContainer.html(html);
    }
    
    // Helper functions (getSignificanceClass, displayNotFound, displayError, generateStudiesTable)
    // are unchanged from the previous version. They are included here for completeness.
    
    function generateStudiesTable(studies) {
        if (!studies || studies.length === 0) return '<p class="text-muted mt-4">No functional studies available for this variant.</p>';
        const tableHeader = `<thead class="table-light"><tr><th>Type of Functional Study</th><th>Result</th><th>Publication</th></tr></thead>`;
        const tableRows = studies.map(study => {
            const pubmedLink = `https://pubmed.ncbi.nlm.nih.gov/${study.pubmedId}/`;
            const linkText = `${study.author} et al. ${study.year}`;
            const highlightClass = study.isHighlighted ? 'table-highlight' : '';
            return `<tr class="${highlightClass}"><td>${study.studyType}</td><td>${study.result}</td><td><a href="${pubmedLink}" target="_blank" rel="noopener noreferrer">${linkText}</a></td></tr>`;
        }).join('');
        return `<h5 class="mt-4">Functional Studies</h5><div class="table-responsive"><table class="table table-bordered table-hover studies-table">${tableHeader}<tbody>${tableRows}</tbody></table></div>`;
    }

    function displayNotFound(message) { const html = `<div class="alert alert-warning text-center" role="alert"><strong>Not Found:</strong> ${message}</div>`; $resultsContainer.html(html); }
    function displayError(message) { const html = `<div class="alert alert-danger text-center" role="alert"><strong>Error:</strong> ${message}</div>`; $resultsContainer.html(html); }
    function getSignificanceClass(significance) { if (!significance) return 'bg-secondary'; const lowerCaseSig = significance.toLowerCase(); if (lowerCaseSig === 'pathogenic') return 'bg-danger'; if (lowerCaseSig === 'benign') return 'bg-success'; if (lowerCaseSig.includes('conflicting')) return 'bg-warning text-dark'; return 'bg-secondary'; }
});
