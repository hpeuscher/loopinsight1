/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { expect } from 'chai'
import {
    CommonPatientParametersDescription
} from '../../../src/core/AbstractODEPatient.js'
import ODEPatient from '../../../src/types/ODEPatientModel.js'
import { ParameterValues } from '../../../src/types/ParametricModule.js'
import Patient, {
    PatientOutput,
    PatientProfile, PatientState
} from '../../../src/types/Patient.js'
import FindLocalModules from '../../../util/FindLocalModules.js'
import ModuleContentsTest from './ModuleContentsTest.js'
import ParametricModuleTest from './ParametricModuleTest.js'
import { ModuleContents } from '../../../src/types/ModuleProfile.js'

import SolverRK4 from '../../../src/core/solvers/SolverRK4.js'

const modelList = await FindLocalModules('src/core/models')
const solver = new SolverRK4()

for (const filename in modelList) {

    const module: ModuleContents = await import(
        `../../../src/core/models/${filename}`
    )

    describe("virtual patient " + filename, () => {

        // test for file contents
        it("should contain all required elements", () => {
            ModuleContentsTest("patient", module)
        })

        const model = module.default
        it("default export should be a constructor", () => {
            expect(model).to.not.be.undefined
            expect(new model()).to.not.be.undefined
        })

        // run generic tests for parametric module
        it("should pass tests for interface ParametricModule", () => {
            ParametricModuleTest(model, CommonPatientParametersDescription)
        })

        it("should create patient object", () => {
            const patient: Patient = new model()
            const t = new Date(2023, 9, 3, 12, 0, 0)
            patient.reset?.(t, 1, solver)

            describe(filename + "#getModelInfo", () => {
                it("should return meta information about the model", () => {
                    const modelInfo = patient.getModelInfo()
                    expect(modelInfo).to.be.an("object")
                    describe("model id", () => {
                        it("should match filename", () => {
                            expect(modelInfo.id).to.equal(filename)
                        })
                    })
                    describe("model type", () => {
                        it("model type should be patient", () => {
                            expect(modelInfo.type).to.equal("patient")
                        })
                    })
                })
            })

            describe(filename + "#getInputList", () => {
                it("should return list of inputs as used by model", () => {
                    const list = patient.getInputList()
                    expect(list.length).to.be.greaterThan(0)
                })

                //     describe("check if these inputs are actually considered", () => {
                //         const list = patient.getInputList()
                //         const x0 = patient.getInitialState()
                //         const t = new Date(2023, 7, 22, 12, 0, 0)
                //         const dx_dt: PatientState = patient.getDerivatives(t, {...x0}, {})
                //         patient.updateDiscontinuousStates(t, {})
                //         const x1 = {... patient.getState()}
                //         for (const l of list) {
                //             it("input " + l + " should have an influence on computed derivatives", () => {
                //                 const u: PatientInput = {[l]: 100000}
                //                 const dx_dt2 = patient.getDerivatives(t, {...x0}, u)
                //                 patient.updateDiscontinuousStates(t, u)
                //                 const x2 = {... patient.getState()}
                //                 const d = p1norm(dx_dt) - p1norm(dx_dt2) + p1norm(x1) - p1norm(x2)
                //                 expect(d).to.not.equal(0)
                //             })
                //         }
                //     })
            })

            describe(filename + "#getOutputList", () => {
                it("should return list of outputs", () => {
                    const list = patient.getOutputList()
                    expect(list).to.be.an("array")

                })
            })

            describe(filename + "#getOutput", () => {
                it("should return patient output containing Gp", () => {
                    const y: PatientOutput = patient.getOutput()
                    expect(typeof y).to.equal("object")
                    expect("Gp" in y).to.be.true
                })
            })


            describe(filename + "#getStateDescription", () => {
                it("should return description of state as object", () => {
                    const stateDesc = patient.getStateDescription()
                    expect(typeof stateDesc).to.equal("object")
                })
            })

            describe(filename + "#getState", () => {
                it("should return patient state as an object", () => {
                    const stateDesc = patient.getStateDescription()
                    const x0 = patient.getState()
                    expect(typeof x0).to.equal("object")


                    it("state must contain all state variables", () => {
                        for (const state of Object.keys(stateDesc)) {
                            describe(`state variable ${state}`, () => {
                                it("should exist", () => {
                                    expect(x0).to.have.property(state)
                                })
                                it("should be a number", () => {
                                    expect(x0).to.be.a("number")
                                })
                            })
                        }

                    })

                })
            })


            describe(filename + "#getPatientProfile", () => {
                it("should return patient profile", () => {
                    const profile: PatientProfile = patient.getPatientProfile()
                    expect(profile).to.be.an("object")
                })
            })


            // describe(filename + "#setInitialState", () => {
            //     it("should accept initial patient state and return it", () => {
            //         // fetch original initial state
            //         let x0: PatientState = patient.getInitialState()
            //         // modify it
            //         x0[Object.keys(x0)[0]] = 2 * x0[Object.keys(x0)[0]]
            //         // overwrite the original one
            //         patient.setInitialState(x0)
            //         // make sure the new one is used now
            //         expect(patient.getInitialState()).to.deep.equal(x0)
            //     })
            // })


            describe(filename + "#update", () => {
                it("should update patient and not generate NaN", () => {
                    const x0 = { ...patient.getState() }
                    patient.update(t, (t: Date) => {return { iir: 1, meal: 50, carbs: 1 }})
                    const x = patient.getState()
                    expect(x).to.have.same.keys(x0)
                    expect(p1norm(x)).to.not.NaN
                })
            })

            const patientODE = <ODEPatient<{}>><unknown>patient

            if (typeof patientODE.computeDerivatives !== "undefined")
                describe(filename + "#computeDerivatives", () => {
                    it("should return object containing derivatives", () => {
                        const x0 = { ...patient.getState() }
                        const dx_dt = patientODE.computeDerivatives(t, x0,
                            { iir: 1, meal: 50, carbs: 1 })
                        expect(typeof dx_dt).to.equal("object")
                        expect(dx_dt).to.have.same.keys(x0)
                        expect(p1norm(dx_dt)).to.not.NaN
                    })
                    it("should return object containing derivatives even when no inputs are given", () => {
                        const x0 = { ...patient.getState() }
                        const dx_dt = patientODE.computeDerivatives(t, x0, {})
                        expect(typeof dx_dt).to.equal("object")
                        expect(dx_dt).to.have.same.keys(x0)
                        expect(p1norm(dx_dt)).to.not.NaN
                    })
                })

            if (typeof patientODE.computeOutput !== "undefined")
                describe(filename + "#computeOutput", () => {
                    it("should return outputs as object", () => {
                        const y = patientODE.computeOutput(t, patient.getState())
                        expect(typeof y).to.equal("object")
                        expect(p1norm(y)).to.not.NaN
                        expect(y.Gp).to.be.a("number")
                    })
                })

            if (typeof patientODE.updateDiscontinuousStates !== "undefined")
                describe(filename + "#updateDiscontinuousStates", () => {
                    it("should update and return patient state", () => {
                        const x0 = { ...patient.getState() }
                        patientODE.updateDiscontinuousStates!(t, x0, { iir: 1, meal: 50, carbs: 1 })
                        const x = patient.getState()
                        expect(x).to.have.same.keys(x0)
                        expect(p1norm(x)).to.not.NaN
                    })
                    it("should update and return patient state even when no inputs are given", () => {
                        const x0 = { ...patient.getState() }
                        patientODE.updateDiscontinuousStates!(t, x0, {})
                        const x = patient.getState()
                        expect(x).to.have.same.keys(x0)
                        expect(p1norm(x)).to.not.NaN
                    })
                })


            if (typeof patientODE.computeIIR !== "undefined")
                describe(filename + "#computeIIR", () => {
                    it("should return insulin infusion rate", () => {
                        const IIReq = patientODE.computeIIR!(100, t)
                        expect(IIReq).to.be.a("number")
                    })
                    it("insulin infusion rate should stabilize Gp at desired value", () => {
                        const IIReq = patientODE.computeIIR!(100, t)
                        const xeq = patientODE.computeSteadyState({ iir: IIReq }, t)
                        const y = patientODE.computeOutput(t, xeq)
                        expect(y.Gp).to.be.closeTo(100, 0.1)
                    })
                })


            /**
             * An array of modifications applied to a virtual patient before a test; 
             * and their textual descriptions.
             * @readonly
             * @property{Object[]} modifiers -- a list of modifiers
             * @property{Function} modifiers[].props -- an object of property names and their modified values
             * @property{string} modifiers[].desc -- textual description of the associated class
             */
            const modifiers: any = [
                { props: {}, desc: "steady state is unmodified" },
                { props: { BW: 50 }, desc: "BW is set to 50" },
            ]

            describe(filename + "#computeSteadyState", () => {
                for (const modifier of modifiers) {
                    computeSteadyState_parametric_test(model, modifier.props, modifier.desc)
                }
            })
        })
    })
}



/**
 * Runs a parametric unit test of a VirtualPatient's #computeSteadyState
 * function.
 * 
 * @param {Function} PatientClass the VirtualPatient class to be tested
 * @param {PatientParameters} modifier a number of modifications applied to the 
 * VirtualPatient before testing; names should equal attributes of the 
 * VirtualPatient
 * @param {string} modifier_description a textual description of the modifier
 */
function computeSteadyState_parametric_test(PatientClass: any, modifier: ParameterValues, modifier_description: string) {
    it("should return zero derivatives when " + modifier_description, () => {
        const patient: ODEPatient<{}> = new PatientClass(modifier)
        // patient.setParameterValues()
        const t = new Date(2023, 9, 3, 12, 0, 0)
        const u = { iir: patient.computeIIR?.(100, t) ?? 1 }
        const x = patient.computeSteadyState(u, t)
        const dx_dt = patient.computeDerivatives(t, x, u)
        const norm = p1norm(dx_dt)
        expect(norm).to.lessThan(1e-6)
    })
}



/**
 * compute p1-Norm of vector
 * @param {PatientState} x
 * @returns \sum{|x_i|}
 */
function p1norm(x: PatientState) {
    const x_array = Object.values(x)
    return x_array.reduce((n, v) => n + Math.abs(v), 0)
}

