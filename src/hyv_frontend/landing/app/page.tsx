import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Database, Sparkles, BarChart3, ShieldCheck, Layers, Store, Zap } from "lucide-react"
import styles from './page.module.css'

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen bg-[#101113] text-white">
      {/* Navigation */}
      <nav className="container mx-auto flex items-center justify-between py-6 px-4">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-[#0f9d58]" />
          <span className="font-bold text-xl">Hyv</span>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <Link href="#features" className="text-sm text-gray-300 hover:text-white transition-colors">
            Features
          </Link>
          <Link href="#why" className="text-sm text-gray-300 hover:text-white transition-colors">
            Why Hyv
          </Link>
          <Link href="#marketplace" className="text-sm text-gray-300 hover:text-white transition-colors">
            Marketplace
          </Link>
          <Link href="#docs" className="text-sm text-gray-300 hover:text-white transition-colors">
            Docs
          </Link>
        </div>
        <Button className="bg-[#0f9d58] hover:bg-[#0f9d58]/90 text-white rounded-md">Get Started</Button>
      </nav>

      {/* Hero Section */}
      <section className="container px-4 py-20 flex flex-col items-center text-center">
        <h1 className={styles.heroTitle}>
          Generate Synthetic Data
          <br />
          <span className={styles.heroHighlight}>For AI Training</span>
        </h1>
        <p className={styles.heroSubtitle}>
          Hyv is a decentralized platform built on the Internet Computer Protocol that enables AI developers to
          generate, trade, and utilize high-quality synthetic data for training advanced AI models.
        </p>
        <Button className="bg-[#0f9d58] hover:bg-[#0f9d58]/90 text-white rounded-md px-8 py-6">
          Start Generating Data
        </Button>
      </section>

      {/* Why Hyv Matters */}
      <section id="why" className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-16">Why Hyv Matters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-[#1e1e1e] p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Decentralized & Secure</h3>
            <p className="text-gray-400">
              Built on ICP blockchain technology, ensuring your data and models remain secure and tamper-proof.
            </p>
          </div>
          <div className="bg-[#1e1e1e] p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">High-Quality Synthetic Data</h3>
            <p className="text-gray-400">
              Generate diverse, balanced, and privacy-compliant synthetic datasets for training robust AI models.
            </p>
          </div>
          <div className="bg-[#1e1e1e] p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Marketplace Ecosystem</h3>
            <p className="text-gray-400">
              Buy, sell, and trade specialized synthetic datasets and models in our decentralized marketplace.
            </p>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section id="features" className="container px-4 py-20">
        <h2 className={styles.sectionTitle}>Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Layers className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Custom Data Generation</h3>
              <p className="text-muted-foreground">
                Create synthetic datasets tailored to your specific needs and requirements.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Store className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Marketplace</h3>
              <p className="text-muted-foreground">
                Buy and sell synthetic datasets in our decentralized marketplace.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Fast & Scalable</h3>
              <p className="text-muted-foreground">
                Generate large datasets quickly with our distributed computing infrastructure.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Privacy-Preserving</h3>
              <p className="text-muted-foreground">
                Generate data that preserves privacy while maintaining statistical properties.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Marketplace Section */}
      <section id="marketplace" className="container px-4 py-20">
        <h2 className={styles.sectionTitle}>Featured Datasets</h2>
        <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">
          Browse and purchase high-quality synthetic datasets from our growing marketplace.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Dataset Card 1 */}
          <div className="bg-card rounded-lg overflow-hidden border border-border">
            <div className="h-40 bg-gradient-to-r from-primary/10 to-primary/5 flex items-center justify-center">
              <Database className="h-12 w-12 text-primary" />
            </div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold">Financial Transactions</h3>
                <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded">Popular</span>
              </div>
              <p className="text-muted-foreground mb-4">
                Synthetic financial transaction data for fraud detection models.
              </p>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">By DataSynth Labs</span>
                <span className="font-semibold">5.2 ICP</span>
              </div>
            </div>
          </div>

          {/* Dataset Card 2 */}
          <div className="bg-card rounded-lg overflow-hidden border border-border">
            <div className="h-40 bg-gradient-to-r from-primary/10 to-primary/5 flex items-center justify-center">
              <Image 
                src="/medical-icon.svg" 
                alt="Medical" 
                width={48} 
                height={48} 
                className="text-primary"
              />
            </div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold">Medical Imaging</h3>
                <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded">Verified</span>
              </div>
              <p className="text-muted-foreground mb-4">
                Synthetic medical imaging data for diagnostic AI training.
              </p>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">By HealthAI Collective</span>
                <span className="font-semibold">8.7 ICP</span>
              </div>
            </div>
          </div>

          {/* Dataset Card 3 */}
          <div className="bg-card rounded-lg overflow-hidden border border-border">
            <div className="h-40 bg-gradient-to-r from-primary/10 to-primary/5 flex items-center justify-center">
              <svg className="h-12 w-12 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
              </svg>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold">NLP Corpus</h3>
                <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded">New</span>
              </div>
              <p className="text-muted-foreground mb-4">
                Diverse synthetic text corpus for natural language processing models.
              </p>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">By TextGen AI</span>
                <span className="font-semibold">3.5 ICP</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <button className="btn btn-outline">
            Explore All Datasets
          </button>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-16">How Hyv Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          <div className="bg-[#1e1e1e] p-6 rounded-lg">
            <div className="w-10 h-10 bg-[#0f9d58]/20 rounded-full flex items-center justify-center mb-4">
              <span className="font-bold text-[#0f9d58]">1</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">Define Requirements</h3>
            <p className="text-gray-400">Specify the type, volume, and characteristics of data you need.</p>
          </div>
          <div className="bg-[#1e1e1e] p-6 rounded-lg">
            <div className="w-10 h-10 bg-[#0f9d58]/20 rounded-full flex items-center justify-center mb-4">
              <span className="font-bold text-[#0f9d58]">2</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">Generate Data</h3>
            <p className="text-gray-400">Our AI creates high-quality synthetic data matching your specifications.</p>
          </div>
          <div className="bg-[#1e1e1e] p-6 rounded-lg">
            <div className="w-10 h-10 bg-[#0f9d58]/20 rounded-full flex items-center justify-center mb-4">
              <span className="font-bold text-[#0f9d58]">3</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">Validate & Refine</h3>
            <p className="text-gray-400">Analyze and optimize your synthetic data for quality and utility.</p>
          </div>
          <div className="bg-[#1e1e1e] p-6 rounded-lg">
            <div className="w-10 h-10 bg-[#0f9d58]/20 rounded-full flex items-center justify-center mb-4">
              <span className="font-bold text-[#0f9d58]">4</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">Train & Deploy</h3>
            <p className="text-gray-400">Use your synthetic data to train AI models or sell it on our marketplace.</p>
          </div>
        </div>
        <div className="mt-12 bg-[#1e1e1e] p-4 rounded-lg max-w-4xl mx-auto">
          <div className="aspect-video bg-[#101113] rounded-lg flex items-center justify-center">
            <Image
              src="/placeholder.svg?height=480&width=854"
              width={854}
              height={480}
              alt="Hyv Platform Demo"
              className="rounded-lg"
            />
          </div>
        </div>
      </section>

      {/* Interactive Demo */}
      <section className="container mx-auto px-4 py-20 bg-[#0f9d58]/5 rounded-xl">
        <h2 className="text-3xl font-bold text-center mb-16">Try Our Interactive Demo</h2>
        <div className="max-w-4xl mx-auto bg-[#1e1e1e] p-6 rounded-lg">
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-3">Generate Sample Synthetic Data</h3>
            <p className="text-gray-400 mb-4">
              Select data type and parameters to see how Hyv generates high-quality synthetic data.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Data Type</label>
              <select className="w-full bg-[#101113] border border-gray-700 rounded-md p-2 text-white">
                <option>Tabular Data</option>
                <option>Text Corpus</option>
                <option>Image Dataset</option>
                <option>Time Series</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Sample Size</label>
              <select className="w-full bg-[#101113] border border-gray-700 rounded-md p-2 text-white">
                <option>Small (100 samples)</option>
                <option>Medium (1,000 samples)</option>
                <option>Large (10,000 samples)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Quality Level</label>
              <select className="w-full bg-[#101113] border border-gray-700 rounded-md p-2 text-white">
                <option>Standard</option>
                <option>Premium</option>
                <option>Research-grade</option>
              </select>
            </div>
          </div>

          <div className="flex justify-center mb-6">
            <Button className="bg-[#0f9d58] hover:bg-[#0f9d58]/90 text-white">
              <Zap className="mr-2 h-4 w-4" /> Generate Sample
            </Button>
          </div>

          <div className="bg-[#101113] rounded-lg p-4 h-64 flex items-center justify-center">
            <p className="text-gray-500 text-center">Your generated synthetic data preview will appear here</p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-16">What AI Developers Say</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-[#1e1e1e] p-6 rounded-lg">
            <p className="text-gray-400 mb-4">
              "Hyv has revolutionized how we train our financial models. The synthetic data is indistinguishable from
              real data while maintaining complete privacy compliance."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-700"></div>
              <div>
                <p className="font-medium">Elena Kowalski</p>
                <p className="text-sm text-gray-500">Lead AI Researcher, FinTech Innovations</p>
              </div>
            </div>
          </div>
          <div className="bg-[#1e1e1e] p-6 rounded-lg">
            <p className="text-gray-400 mb-4">
              "The marketplace has been a game-changer for our startup. We can now access specialized datasets that
              would have taken months to generate ourselves."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-700"></div>
              <div>
                <p className="font-medium">Marcus Chen</p>
                <p className="text-sm text-gray-500">CTO, AI Health Solutions</p>
              </div>
            </div>
          </div>
          <div className="bg-[#1e1e1e] p-6 rounded-lg">
            <p className="text-gray-400 mb-4">
              "Building on ICP blockchain gives us confidence in data provenance and security. Hyv's platform is both
              innovative and trustworthy."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-700"></div>
              <div>
                <p className="font-medium">Sophia Rodriguez</p>
                <p className="text-sm text-gray-500">AI Security Specialist, BlockSafe</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ICP Integration */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-gradient-to-r from-[#0f9d58]/20 to-[#101113] p-8 rounded-xl">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-6 md:mb-0 md:pr-8">
              <h2 className="text-3xl font-bold mb-4">Powered by Internet Computer Protocol</h2>
              <p className="text-gray-400 mb-6">
                Hyv leverages the Internet Computer Protocol blockchain to provide a decentralized, secure, and
                transparent platform for synthetic data generation and trading. Benefit from the speed, security, and
                scalability of ICP.
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="bg-[#1e1e1e] px-4 py-2 rounded-lg flex items-center">
                  <ShieldCheck className="h-5 w-5 text-[#0f9d58] mr-2" />
                  <span>Secure Transactions</span>
                </div>
                <div className="bg-[#1e1e1e] px-4 py-2 rounded-lg flex items-center">
                  <Zap className="h-5 w-5 text-[#0f9d58] mr-2" />
                  <span>Fast Processing</span>
                </div>
                <div className="bg-[#1e1e1e] px-4 py-2 rounded-lg flex items-center">
                  <Layers className="h-5 w-5 text-[#0f9d58] mr-2" />
                  <span>Scalable Infrastructure</span>
                </div>
              </div>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <Image
                src="/placeholder.svg?height=300&width=300"
                width={300}
                height={300}
                alt="ICP Blockchain"
                className="rounded-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Ready to Get Started */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Transform AI Training?</h2>
          <p className="text-gray-400 mb-8">
            Join the growing community of AI developers using Hyv to generate high-quality synthetic data and accelerate
            their AI development.
          </p>
          <Button className="bg-[#0f9d58] hover:bg-[#0f9d58]/90 text-white rounded-md px-8 py-6">
            Start Free Trial
          </Button>
          <p className="text-sm text-gray-500 mt-4">No credit card required • 5 GB free synthetic data</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-16">Frequently Asked Questions</h2>
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-[#1e1e1e] p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">What is synthetic data?</h3>
            <p className="text-gray-400">
              Synthetic data is artificially generated information that mimics real-world data without containing any
              actual personal or sensitive information, making it ideal for AI training while preserving privacy.
            </p>
          </div>
          <div className="bg-[#1e1e1e] p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">How does Hyv ensure data quality?</h3>
            <p className="text-gray-400">
              Hyv uses advanced generative models and quality assurance algorithms to ensure synthetic data maintains
              the statistical properties, relationships, and edge cases present in real-world data.
            </p>
          </div>
          <div className="bg-[#1e1e1e] p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">How does the marketplace work?</h3>
            <p className="text-gray-400">
              Our decentralized marketplace allows data creators to sell their synthetic datasets and models directly to
              buyers using ICP tokens, with smart contracts ensuring secure and transparent transactions.
            </p>
          </div>
          <div className="bg-[#1e1e1e] p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Is Hyv compliant with data privacy regulations?</h3>
            <p className="text-gray-400">
              Yes, Hyv's synthetic data generation process is designed to be compliant with GDPR, CCPA, and other data
              privacy regulations since it doesn't contain any actual personal data.
            </p>
          </div>
          <div className="bg-[#1e1e1e] p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">What types of data can Hyv generate?</h3>
            <p className="text-gray-400">
              Hyv can generate various types of synthetic data including tabular data, text, images, time-series data,
              and more, suitable for training a wide range of AI models across different domains.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0c070b] py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between mb-12">
            <div className="mb-8 md:mb-0">
              <div className="flex items-center gap-2 mb-4">
                <Database className="h-5 w-5 text-[#0f9d58]" />
                <span className="font-bold text-xl">Hyv</span>
              </div>
              <p className="text-gray-400 max-w-xs">
                Decentralized synthetic data generation platform for AI training, powered by the Internet Computer
                Protocol.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h3 className="font-semibold mb-4">Platform</h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="#" className="text-gray-400 hover:text-white text-sm">
                      Features
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-gray-400 hover:text-white text-sm">
                      Pricing
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-gray-400 hover:text-white text-sm">
                      Marketplace
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-gray-400 hover:text-white text-sm">
                      API
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Resources</h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="#" className="text-gray-400 hover:text-white text-sm">
                      Documentation
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-gray-400 hover:text-white text-sm">
                      Tutorials
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-gray-400 hover:text-white text-sm">
                      Blog
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-gray-400 hover:text-white text-sm">
                      Community
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Company</h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="#" className="text-gray-400 hover:text-white text-sm">
                      About
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-gray-400 hover:text-white text-sm">
                      Careers
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-gray-400 hover:text-white text-sm">
                      Contact
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-gray-400 hover:text-white text-sm">
                      Legal
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm"> 2025 Hyv. All rights reserved.</p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <Link href="#" className="text-gray-400 hover:text-white">
                <span className="sr-only">Twitter</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white">
                <span className="sr-only">GitHub</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white">
                <span className="sr-only">Discord</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
