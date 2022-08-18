import { pluginParameter, Constructable } from 'shared/assets/interfaces/interfaces'

declare global {
	interface Window {
		google: {
			ima: {
				ViewMode: {
					NORMAL: string
				}
				AdEvent: {
					Type: {
						CONTENT_PAUSE_REQUESTED: string
						CONTENT_RESUME_REQUESTED: string
						STARTED: string
						PAUSED: string
						RESUMED: string
						COMPLETE: string
						LOADED: string
						ALL_ADS_COMPLETED: string
						SKIPPED: string
					}
				}
				AdErrorEvent: {
					Type: {
						AD_ERROR: string
					}
				}
				AdsRequest: Constructable<any>
				AdsManagerLoadedEvent: {
					Type: {
						ADS_MANAGER_LOADED: string
					}
				}
				AdDisplayContainer: Constructable<any>
				AdsLoader: Constructable<any>
				settings: {
					setLocale: (locale: string) => void
				}
			}
		}
	}
}

interface ImaEvent {
	getAd: any
	getError: () => void
	getAdsManager: (adsManagerLoadedEvent: any) => void
}

/**
 * Vlitejs Ima plugin
 * @module Vlitejs/plugins/ima
 */
export default class ImaPlugin {
	player: any
	options: any
	playerIsReady: boolean
	sdkIsReady: boolean
	adContainer!: HTMLElement
	adCountDown!: HTMLElement
	countdownTimer: number
	resumeAd: boolean
	adDisplayContainer: any
	adsLoader: any
	adsManager: any
	adsLoaded: boolean
	currentAd: null | any

	providers = ['html5']
	types = ['video']

	/**
	 * @constructor
	 * @param {Object} options
	 * @param {Class} options.player Player instance
	 * @param {Object} options.options Plugins options
	 */
	constructor({ player, options = {} }: pluginParameter) {
		this.player = player

		const defaultOptions = {
			locale: 'en',
			countdownText: 'Advertisement'
		}
		this.options = { ...defaultOptions, ...options }

		this.playerIsReady = false
		this.sdkIsReady = false
		this.adsLoaded = false
		this.countdownTimer = 0
		this.resumeAd = false
		this.currentAd = null

		this.onBigPlayButtonClick = this.onBigPlayButtonClick.bind(this)
		this.loadAds = this.loadAds.bind(this)
		this.onResize = this.onResize.bind(this)
		this.onAdsManagerLoaded = this.onAdsManagerLoaded.bind(this)
		this.onAdError = this.onAdError.bind(this)
		this.onContentPauseRequested = this.onContentPauseRequested.bind(this)
		this.onContentResumeRequested = this.onContentResumeRequested.bind(this)
		this.onAdStarted = this.onAdStarted.bind(this)
		this.onAdPaused = this.onAdPaused.bind(this)
		this.onAdResumed = this.onAdResumed.bind(this)
		this.onAdComplete = this.onAdComplete.bind(this)
		this.onAdLoaded = this.onAdLoaded.bind(this)
		this.onAllAdsCompleted = this.onAllAdsCompleted.bind(this)
		this.updateCountdown = this.updateCountdown.bind(this)
	}

	/**
	 * Initialize the plugin
	 */
	init() {
		this.loadImaSdk()
	}

	loadImaSdk() {
		const script = document.createElement('script')
		script.defer = true
		script.type = 'text/javascript'
		script.src = '//imasdk.googleapis.com/js/sdkloader/ima3.js'
		script.onload = () => {
			this.sdkIsReady = true
			this.onPlayerAndImaSdkReady()
		}
		document.getElementsByTagName('body')[0].appendChild(script)
	}

	onReady() {
		this.playerIsReady = true
		this.onPlayerAndImaSdkReady()
	}

	onPlayerAndImaSdkReady() {
		if (this.playerIsReady && this.sdkIsReady) {
			this.render()
			this.adContainer = this.player.elements.container.querySelector('.v-ad')
			this.adCountDown = this.player.elements.container.querySelector('.v-adCountDown')

			this.addEvents()
			this.initAdObjects()
			this.requestAds()
		} else {
			this.player.loading(true)
		}
	}

	render() {
		const template = `<div class="v-ad"><div class="v-adCountDown"></div>`
		this.player.elements.container.insertAdjacentHTML('beforeend', template)
	}

	addEvents() {
		this.player.media.addEventListener('ended', () => this.adsLoader.contentComplete())
		this.player.elements.bigPlay.addEventListener('click', this.onBigPlayButtonClick)
		this.player.on('play', this.loadAds)
		window.addEventListener('resize', this.onResize)
	}

	onBigPlayButtonClick() {
		if (this.resumeAd) {
			this.resumeAd = false
			this.adsManager.resume()
		}
	}

	initAdObjects() {
		this.adsLoaded = false
		window.google.ima.settings.setLocale(this.options.locale)

		this.adDisplayContainer = new window.google.ima.AdDisplayContainer(
			this.adContainer,
			this.player.media
		)
		this.adsLoader = new window.google.ima.AdsLoader(this.adDisplayContainer)
		this.adsLoader.addEventListener(
			window.google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
			this.onAdsManagerLoaded,
			false
		)
		this.adsLoader.addEventListener(
			window.google.ima.AdErrorEvent.Type.AD_ERROR,
			this.onAdError,
			false
		)
	}

	requestAds() {
		const adsRequest = new window.google.ima.AdsRequest()
		adsRequest.adTagUrl = this.options.adTagUrl
		adsRequest.linearAdSlotWidth = this.player.media.clientWidth
		adsRequest.linearAdSlotHeight = this.player.media.clientHeight
		adsRequest.nonLinearAdSlotWidth = this.player.media.clientWidth
		adsRequest.nonLinearAdSlotHeight = this.player.media.clientHeight / 3
		this.adsLoader.requestAds(adsRequest)
	}

	onAdsManagerLoaded(adsManagerLoadedEvent: ImaEvent) {
		this.adsManager = adsManagerLoadedEvent.getAdsManager(this.player.media)

		this.adsManager.addEventListener(
			window.google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED,
			this.onContentPauseRequested
		)
		this.adsManager.addEventListener(
			window.google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED,
			this.onContentResumeRequested
		)
		this.adsManager.addEventListener(window.google.ima.AdEvent.Type.STARTED, this.onAdStarted)
		this.adsManager.addEventListener(window.google.ima.AdEvent.Type.PAUSED, this.onAdPaused)
		this.adsManager.addEventListener(window.google.ima.AdEvent.Type.RESUMED, this.onAdResumed)
		this.adsManager.addEventListener(window.google.ima.AdEvent.Type.COMPLETE, this.onAdComplete)
		this.adsManager.addEventListener(window.google.ima.AdEvent.Type.LOADED, this.onAdLoaded)
		this.adsManager.addEventListener(
			window.google.ima.AdEvent.Type.ALL_ADS_COMPLETED,
			this.onAllAdsCompleted
		)
		this.adsManager.addEventListener(window.google.ima.AdEvent.Type.SKIPPED, this.onAdComplete)
	}

	onContentPauseRequested() {
		this.player.isPaused === false && this.player.pause()
	}

	onContentResumeRequested() {
		this.player.play()
	}

	onAdStarted(e: ImaEvent) {
		this.player.isAd = true
		this.currentAd = e.getAd()

		this.player.elements.container.classList.add('v-adPlaying')
		this.player.elements.container.classList.remove('v-adPaused')

		this.countdownTimer = window.setInterval(this.updateCountdown, 250)
	}

	updateCountdown() {
		const remainingTime = this.adsManager.getRemainingTime()
		const remainingMinutes = Math.floor(remainingTime / 60)
		const remainingSeconds = Math.floor(remainingTime % 60)
			.toString()
			.padStart(2, '0')
		this.adCountDown.innerHTML = `${this.options.countdownText} ${remainingMinutes}:${remainingSeconds}`
	}

	onAdPaused() {
		this.resumeAd = true
		this.player.elements.container.classList.add('v-adPaused')
		this.player.elements.container.classList.remove('v-adPlaying')
	}

	onAdResumed() {
		this.player.elements.container.classList.add('v-adPlaying')
		this.player.elements.container.classList.remove('v-adPaused')
	}

	onAdComplete() {
		window.clearInterval(this.countdownTimer)
	}

	onAdLoaded(e: ImaEvent) {
		!e.getAd().isLinear() && this.player.play()
	}

	onAllAdsCompleted() {
		this.clean()
	}

	onAdError() {
		this.clean()
		this.player.play()
	}

	loadAds() {
		if (this.adsLoaded || !this.adDisplayContainer || !this.adsManager) {
			return
		}
		this.adsLoaded = true
		this.adDisplayContainer.initialize()

		try {
			this.adsManager.init(
				this.player.media.clientWidth,
				this.player.media.clientHeight,
				window.google.ima.ViewMode.NORMAL
			)
			this.adsManager.start()
		} catch {
			this.onAdError()
		}
	}

	onResize() {
		this.adsManager &&
			this.adsManager.resize(
				this.player.media.clientWidth,
				this.player.media.clientHeight,
				window.google.ima.ViewMode.NORMAL
			)
	}

	clean() {
		this.player.isAd = false
		this.adContainer.setAttribute('hidden', '')
		this.player.elements.bigPlay.removeEventListener('click', this.onBigPlayButtonClick)
		window.clearInterval(this.countdownTimer)
		this.adCountDown.remove()
		this.player.elements.container.classList.remove('v-adPlaying', 'v-adPaused')
	}

	destroy() {
		this.clean()
		this.adsManager && this.adsManager.destroy()
		this.adDisplayContainer && this.adDisplayContainer.destroy()
		this.adsLoader && this.adsLoader.destroy()
	}
}
