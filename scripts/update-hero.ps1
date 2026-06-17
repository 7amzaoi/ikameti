$content = Get-Content "index.html" -Raw
$newHero = @"
    <!-- HERO SECTION -->
    <section class="hero-section">
        <div class="hero-content">
            <h1 class="hero-headline">
                Your Gateway to Premium <span class="highlight">Residency &</span> Housing Solutions
            </h1>
            <p class="hero-subtext">
                Expert guidance for immigration, residency, and housing. Trusted by 5000+ clients worldwide.
            </p>
            <div class="hero-buttons">
                <a href="contact.html" class="btn btn-primary">Get Started ➔</a>
                <a href="landing.html" class="btn btn-outline" style="color: white; border-color: white;">Learn More</a>
            </div>
            <div class="hero-trust">
                <div class="trust-item">
                    <div class="trust-metric">5000+</div>
                    <div class="trust-label">HAPPY CLIENTS</div>
                </div>
                <div class="trust-item">
                    <div class="trust-metric">98%</div>
                    <div class="trust-label">SUCCESS RATE</div>
                </div>
                <div class="trust-item">
                    <div class="trust-metric">20+</div>
                    <div class="trust-label">YEARS EXPERIENCE</div>
                </div>
            </div>
        </div>
    </section>
"@

$pattern = '<!-- HERO SECTION -->\s*<section class="bg-dark">[\s\S]*?</section>\s*<!-- FEATURES SECTION -->'
$replacement = $newHero + "`n`n    <!-- FEATURES SECTION -->"
$content = [regex]::Replace($content, $pattern, $replacement, [System.Text.RegularExpressions.RegexOptions]::IgnorePatternWhitespace)
$content | Set-Content "index.html"
Write-Host "Hero section updated successfully!"
